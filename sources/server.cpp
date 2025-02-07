#include "server.hpp"
#include "model.hpp"
#include "http.hpp"
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <hmac_sha256.h>
#include "openai.hpp"
#include <bsl/file.hpp>

DEFINE_LOG_CATEGORY(HttpApiDebug)
DEFINE_LOG_CATEGORY(HttpApiServer)
DEFINE_LOG_CATEGORY(TelegramBridge)
DEFINE_LOG_CATEGORY(OpenAI)

void Fail(httplib::Response &resp, const std::string &error) {
	resp.set_content(nlohmann::json::object({{"Fail", error}}).dump(), "application/json");
	resp.status = httplib::StatusCode::OK_200;
};
void Ok(httplib::Response &resp, const std::string &error) {
	resp.set_content(nlohmann::json::object({{"Ok", error}}).dump(), "application/json");
	resp.status = httplib::StatusCode::OK_200;
};

void Data(httplib::Response &resp, const nlohmann::json &data) {
	resp.set_content(nlohmann::json::object({{"Data", data}}).dump(), "application/json");
	resp.status = httplib::StatusCode::OK_200;
}

const std::int64_t Jeytery = 498016821;

HttpApiServer::HttpApiServer(const INIReader& config):
	m_Config(
		config
	),
	m_Hostname(
		config.Get(SectionName, "Hostname", "localhost")
	),
	m_Port(
		config.GetInteger(SectionName, "Port", 2024)
	),
	m_WebAppPath(
		config.Get(SectionName, "WebAppPath", ".")
	),
	m_RegenerateExtendedCache(
		config.GetBoolean(SectionName, "RegenerateExtendedCache", true)
	),
	m_DB(config),
	m_OpenAIKey(
		config.Get("OpenAI", "Key", "")
	),
	m_BotToken(
		config.Get("Bot", "Token", "")
	),
	m_Bot(
		m_BotToken
	),
	m_Logger(config)
{
	Super::set_mount_point("/", m_WebAppPath);
	
	Super::Get ("/api/user/:id/full", this, &ThisClass::GetFullUser);
	Super::Get ("/api/user/:id/minimal", this, &ThisClass::GetMinimalUser);
	Super::Post("/api/user/:id/preferences/set", this, &ThisClass::SetPreferences);
	Super::Post("/api/debug/log", this, &ThisClass::PostDebugLog);
	Super::Post("/api/user/:id/commit", this, &ThisClass::Commit);
	Super::Post("/api/user/:id/add_streak", this, &ThisClass::AddStreak);
	Super::Post("/api/user/:id/remove_streak", this, &ThisClass::RemoveStreak);
	Super::Get ("/api/user/:id/pending_submition", this, &ThisClass::GetPendingSubmition);
	Super::Post("/api/user/:id/pending_submition", this, &ThisClass::PostPendingSubmition);
	Super::Post("/api/user/:id/add_freeze", this, &ThisClass::AddFreeze);
	Super::Post("/api/user/:id/use_freeze", this, &ThisClass::UseFreeze);
	Super::Post("/api/user/:id/remove_freeze", this, &ThisClass::RemoveFreeze);
	Super::Get ("/api/user/:id/available_freezes", this, &ThisClass::GetAvailableFreezes);
	Super::Get ("/api/quote", this, &ThisClass::GetQuote);
	Super::Post("/api/quote/invalidate", this, &ThisClass::PostInvalidateQuote);
	Super::Post("/api/quote/push", this, &ThisClass::PostPushQuote);
	Super::Get ("/api/user/:id/friends", this, &ThisClass::GetFriends);
	Super::Post("/api/user/:id/friends/accept/:from", this, &ThisClass::AcceptFriendInvite);
	Super::Post("/api/user/:id/friends/remove/:from", this, &ThisClass::RemoveFriend);

	Super::Get( "/api/user/:id/token", this, &ThisClass::GetToken);

	Super::Post("/api/user/:id/challenges/new", this, &ThisClass::NewChallenge);
	Super::Post("/api/user/:id/challenges/join/:challenge", this, &ThisClass::JoinChallenge);
	Super::Post("/api/user/:id/challenges/leave/:challenge", this, &ThisClass::LeaveChallenge);
	Super::Get ("/api/user/:id/challenges/participants/:challenge", this, &ThisClass::GetChallengeParticipants);
	Super::Get ("/api/user/:id/challenges/invite_preview/:challenge", this, &ThisClass::GetChallengeInvitePreview);
	Super::Get ("/api/user/:id/challenges/invite_participants_preview/:challenge", this, &ThisClass::GetChallengeInviteParticipantsPreview);

	Super::Post("/api/timer/day_almost_over", this, &ThisClass::OnDayAlmostOver);
	Super::Post("/api/timer/moment_before_new_day", this, &ThisClass::OnMomentBeforeNewDay);
	Super::Post("/api/timer/new_day", this, &ThisClass::OnNewDay);

	Super::Get ("/api/notifications", this, &ThisClass::GetNotifications);

	Super::Post("/api/user/:id/nudge/:friend", this, &ThisClass::NudgeFriend);

	set_exception_handler([&](const auto& req, auto& res, std::exception_ptr ep) {
		std::string content;
		try {
			std::rethrow_exception(ep);
		} catch (std::exception &e) {
			content = e.what();
		} catch (...) {
			content = "Unknown exception";
		}
		
		m_Logger.Log("Request exception: " + content);

		res.set_content(Format("<h1>Error 500</h1><p>%</p>", content), "text/html");
		res.status = httplib::StatusCode::InternalServerError_500;
	});

	set_error_handler([](const httplib::Request& req, httplib::Response& res) {
		if (req.path.starts_with("/api")) {
			return;
		}

        if (req.path != "/") {
            res.set_redirect("/");
        } else {
            res.status = 404;
            res.set_content("Not Found", "text/text");
        }
    });

	m_LastUpdate = std::chrono::steady_clock::now() - 2 * std::chrono::minutes(m_QuoteUpdateMinutes);

	RegenerateExtendedCache();
}

void HttpApiServer::Run(){
	Super::listen(m_Hostname, m_Port);
}

void HttpApiServer::GetFullUser(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	const auto &user = m_DB.GetUser(id, today);

	//NOTE: History is first because it corrects all the other info
	auto user_json = nlohmann::json(user);
	user_json["History"] = m_DB.ActiveHistoryForToday(id, today);
	user_json["Today"] = DateUtils::Now();
	user_json["Streak"] = m_DB.ActiveStreak(id, today);
	user_json["StreakStart"] = user.FirstCommitEver().value_or(today);
	user_json["Challenges"] = m_DB.ChallengesWithPayload(id, today);
	user_json["Streaks"] = m_DB.StreaksWithPayload(id, today);
	
	std::string content = user_json.dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(content, "application/json");
}

void HttpApiServer::GetMinimalUser(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	const auto &user = m_DB.GetUser(id, today);

	auto user_json = nlohmann::json({ 
		{"Streak", m_DB.ActiveStreak(id, today)},
		{"Today", today},
		{"Protection", ToString(m_DB.ActiveProtection(id, today))}
	});
	
	std::string content = user_json.dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(content, "application/json");
}

void HttpApiServer::SetPreferences(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUserNoAutoFreeze(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	try {
		UserPreferences new_preferences = nlohmann::json::parse(req.body);

		user.GetPreferences() = new_preferences;
	} catch (const std::exception& e) {
		return Fail(resp, Format("Failed to parse UserPreferences: %", e.what()));
	}
	
	Ok(resp, "Preferences are set");
}

void HttpApiServer::AddStreak(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	std::vector<std::string> streaks = nlohmann::json::parse(req.body, nullptr, false, false);

	if (!streaks.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	std::string error;

	for (const auto& streak : streaks) {
		if (user.HasStreak(streak))
			continue;

		if (!user.AddStreak(streak))
			error += "Internal Error";
	}
	
	if(error.size())
		return Fail(resp, error);

	Ok(resp, "Added streaks!");
}

void HttpApiServer::RemoveStreak(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	std::vector<std::int64_t> streaks = nlohmann::json::parse(req.body, nullptr, false, false);

	if (!streaks.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	for (std::int64_t streak_id: streaks)
		user.RemoveStreak(streak_id);

	Ok(resp, "Removed");
}

void HttpApiServer::PostPendingSubmition(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	std::vector<std::int64_t> pending = nlohmann::json::parse(req.body, nullptr, false, false);
	
	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	user.SubmitionFor(today) = pending;
}

void HttpApiServer::GetPendingSubmition(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	
	std::string json = nlohmann::json(user.SubmitionFor(today)).dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(json, "application/json");
}

void HttpApiServer::Commit(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	std::vector<std::int64_t> streaks = nlohmann::json::parse(req.body, nullptr, false, false);

	if (!streaks.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	const Protection initialProtection = m_DB.ActiveProtection(id, today);

	std::string error;
	
	for(auto streak_id: streaks){
		auto *streak = user.GetStreak(streak_id);

		if(!streak){
			error += "Invalid streak Id\n";
			continue;
		}

		if (streak->Challenge.has_value() && !m_DB.CanCommitToChallenge(id, streak->Challenge.value(), today)) {
			error += "You can't commit to this challenge\n";
			continue;
		}
	
		if (streak->IsCommitedAt(today)) {
			error += "Already commited today!\n";
			continue;
		}

		if (!streak->Commit(today)){
			error += "Backend error\n";
			continue;
		}
	}

	user.SubmitionFor(today) = {};

	if(error.size())
		return Fail(resp, error);

	auto EmitExtended = [&](const std::vector<std::string> &info) {
		auto descrs = m_DB.ActiveStreaksDescriptions(id, today);

		nlohmann::json data = nlohmann::json({ 
			{"Comment", GetOrGenerateExtended(descrs)},
			{"Show", info}
		});

		Data(resp, data);
	};


	if (id == Jeytery && initialProtection == Protection::None) {
		auto activeProtection = m_DB.ActiveProtection(id, today);

		auto streak = m_DB.ActiveStreak(id, today);

		if (activeProtection == Protection::Commit) {
			m_Notifications.push_back({
				id,
				Format(UTF8("✅ Commited on your % days streak!"), streak),
				today
			});
		}
		if (activeProtection == Protection::Freeze) {
			m_Notifications.push_back({
				id,
				Format(UTF8("🥶 Freezed your % days streak!"), streak),
				today
			});
		}
	}
	
	//XXX somethimes i may think, maybe design should somehow congrate about extended streaks which are not challenges
	// but someday...
	if (initialProtection == Protection::None && m_DB.ActiveProtection(id, today) == Protection::Freeze) {
		return EmitExtended({"Challenges"});
	}

	if (initialProtection == Protection::None && m_DB.ActiveProtection(id, today) == Protection::Commit) {
		return EmitExtended({"Challenges", "Active"});
	}

	if (initialProtection == Protection::Freeze && m_DB.ActiveProtection(id, today) == Protection::Commit) {
		return EmitExtended({"Active"});
	}
	
	return Ok(resp, "commited");
}

void HttpApiServer::UseFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	auto freeze_id = GetJsonProperty<std::int64_t>(req.body, "freeze_id");

	if (!id || !freeze_id.has_value()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	if(!user.HasSomethingToFreeze(today))
		return Fail(resp, "Nothing to freeze");

	std::optional<std::int64_t> freeze = user.UseFreeze(today, freeze_id.value(), FreezeUsedBy::User);
	
	if (!freeze.has_value())
		return Fail(resp, "You don't have freezes to use for today");

	Ok(resp, Format("Nice, you left with % freezes", user.AvailableFreezes(today).size()));
}

void HttpApiServer::AddFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	std::string reason = GetJsonPropertyOr<std::string>(req.body, "reason", "For no good reason");
	std::int64_t expire = GetJsonPropertyOr<std::int64_t>(req.body, "expire", 4);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	if (!user.CanAddFreeze(today))
		return Fail(resp, "Reached maximum amount of freezes");

	user.AddFreeze(expire, std::move(reason), today);

	Ok(resp, Format("Added streak freeze, % now", user.AvailableFreezes(today).size()));
}

void HttpApiServer::RemoveFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	auto freeze_id = GetJsonProperty<std::int64_t>(req.body, "freeze_id");

	if (!id || !freeze_id.has_value()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	user.RemoveFreeze(freeze_id.value());
}

void HttpApiServer::GetAvailableFreezes(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	
	resp.set_content(nlohmann::json(user.AvailableFreezes(today)).dump(), "application/json");
}

std::optional<std::int64_t> HttpApiServer::GetUser(const httplib::Request& req)const {
	return GetIdParam(req, "id");
}

static std::string HMAC_SHA256(const std::string& data, const std::string& key) {
	std::string result(32, '\0');
	hmac_sha256(key.data(), key.size(), data.data(), data.size(), result.data(), result.size());
	return result;
}

static std::string hex(const std::string& binary) {
	std::string result;
	result.reserve(binary.size() * 2);

	for (auto byte : binary) {
		char digits[3] = {0};
		sprintf(digits, "%02x", (std::uint8_t)byte);
		result += digits;
	}

    return result;
}

static std::map<std::string, std::string> ParseQueryString(const std::string& query) {
    std::map<std::string, std::string> values;
    std::size_t start = 0;
    std::size_t end;
    
    // Process the query string
    while ((end = query.find('&', start)) != std::string::npos) {
        std::string pair = query.substr(start, end - start);
        
        // Split each pair by '=' to get the key and value
        std::size_t equal_sign = pair.find('=');
        if (equal_sign != std::string::npos) {
            std::string key = pair.substr(0, equal_sign);
            std::string value = pair.substr(equal_sign + 1);
            values[key] = value;
        }
        
        start = end + 1;
    }
    
    // Process the last key-value pair (or the only one if no '&' character)
    if (start < query.length()) {
        std::string pair = query.substr(start);
        std::size_t equal_sign = pair.find('=');
        if (equal_sign != std::string::npos) {
            std::string key = pair.substr(0, equal_sign);
            std::string value = pair.substr(equal_sign + 1);
            values[key] = value;
        }
    }
    
    return values;
}

static std::string BuildCheckDataString(const std::map<std::string, std::string> &values) {
	std::string result;
	bool is_first = true;

	for (const auto& [key, value] : values) {
		if (is_first) {
			is_first = false;
		} else {
			result.push_back('\n');
		}
		result.append(key + "=" + value);
	}

	return result;
}

bool HttpApiServer::IsAuthForUserTgHash(const httplib::Request& req, std::int64_t user) const {
	const char *CheckDataStringKey = "Datacheckstring";
	const char *HashKey = "Hash";

	if(!req.headers.count(HashKey) || !req.headers.count(CheckDataStringKey))
		return false;

	std::map<std::string, std::string> query = ParseQueryString(req.headers.find(CheckDataStringKey)->second);
	
	nlohmann::json user_json = nlohmann::json::parse(query["user"], nullptr, false, false);

	if(user_json["id"].get<std::int64_t>() != user)
		return false;

	query.erase("hash");

	std::string CheckDataString = BuildCheckDataString(query);
	std::string Hash = req.headers.find(HashKey)->second;

	std::string secret_key = HMAC_SHA256(m_BotToken, "WebAppData");
	std::string hashed_check_data_string = HMAC_SHA256(CheckDataString, secret_key);
	std::string result = hex(hashed_check_data_string);
	return result == Hash;
}

bool HttpApiServer::IsAuthForUserByToken(const httplib::Request& req, std::int64_t user) const {
	const char *AuthKey = "Authorization";

	if (!req.headers.count(AuthKey))
		return false;

	const std::string &token = req.headers.find(AuthKey)->second;

	return m_DB.GetToken(user) == token;
}

bool HttpApiServer::IsAuthForUser(const httplib::Request &req, std::int64_t user) const{
	return IsAuthForUserByToken(req, user) || IsAuthForUserTgHash(req, user);
}

void HttpApiServer::PostDebugLog(const httplib::Request& req, httplib::Response& resp){
	LogHttpApiDebug(Display, "%", req.body);
	resp.status = 200;
}

void HttpApiServer::PostPushQuote(const httplib::Request& req, httplib::Response& resp){
	if (!IsAuthByBot(req)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto quotes = std::move(m_Quotes);

	m_Quotes.push(req.body);
	
	while (quotes.size()) {
		m_Quotes.push(quotes.front());
		quotes.pop();
	}

	m_LastUpdate = std::chrono::steady_clock::now();
	resp.status = 200;
}

void HttpApiServer::PostInvalidateQuote(const httplib::Request& req, httplib::Response& resp){
	if (!IsAuthByBot(req)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	m_LastUpdate = std::chrono::steady_clock::now() - 2 * std::chrono::minutes(m_QuoteUpdateMinutes);
	resp.status = 200;
}

bool HttpApiServer::IsAuthByBot(const httplib::Request& req) const{
	auto token = req.headers.find("BotToken");

	if (token == req.headers.end()) {
		return false;
	}

	return token->second == m_BotToken;
}

static bool GenerateNewQuotes(std::queue<std::string>& quotes, const std::string &key) {
	const char *Prompt = 
R"(give me json strings array of 15 pseudo motivational quotes in a post-modern sarcastic style, output them in a format of
["Quote 1 text", "Quote 2 text", ....])";

	std::string response = OpenAI::Complete(key, {{OpenAI::Role::User, Prompt}}, 1.0f, "gpt-4o").value_or("");

	if(!response.size())
		return false;

	auto begin = response.find_first_of('[');
	auto end = response.find_last_of(']');

	if(begin == std::string::npos || end == std::string::npos || end <= begin)
		return (LogOpenAI(Error, "Got unparsable response: %", response), false);
	
	auto count = end - begin + 1;
	
	try{
		std::string json_string = response.substr(begin, count);

		auto json = nlohmann::json::parse(json_string, nullptr, false, false);

		if(!json.is_array())
			return (LogOpenAI(Error, "Expected Json array, got: %", response), false);

		if(!json.size())
			return (LogOpenAI(Error, "Got zero quotes: %", response), false);

		for (auto quote : json) {
			if (!quote.is_string()) {
				continue;
			}
			quotes.push(quote.get<std::string>());
		}
		return true;
	} catch (const std::exception& e) {
		LogOpenAI(Error, "Caught exception during generated quotes parsing: %", e.what());
	}

	return false;
}

void HttpApiServer::GetQuote(const httplib::Request& req, httplib::Response& resp){

	auto now = std::chrono::steady_clock::now();

	auto duration = std::chrono::duration_cast<std::chrono::minutes>(now - m_LastUpdate);
	
	if(duration >= std::chrono::minutes(m_QuoteUpdateMinutes)){
		if(m_Quotes.size())
			m_Quotes.pop();

		if (!m_Quotes.size())
			GenerateNewQuotes(m_Quotes, m_OpenAIKey);

		m_LastUpdate = now;
	}

	LogHttpApiServerIf(!m_Quotes.size(), Warning, "Returning placeholder quote for some reason");

	resp.status = 200;
	resp.set_content(Format(R"({"quote": "%"})", m_Quotes.size() ? m_Quotes.front() : "Somethimes it's time..."), "application/json");
}

void HttpApiServer::AcceptFriendInvite(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t from = GetIdParam(req, "from").value_or(0);

	if (!id || !from) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	m_DB.AddFriends(id, from);

	Ok(resp, "Added friends");
}

void HttpApiServer::RemoveFriend(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t from = GetIdParam(req, "from").value_or(0);

	if (!id || !from) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	m_DB.RemoveFriends(id, from);

	Ok(resp, "Removed friend");
}


void HttpApiServer::GetFriends(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto friends = m_DB.GetFriendsInfo(id, today);

	for (auto& f: friends) {
		auto chat = m_Bot.getApi().getChat(f.Id);
		f.FullName = chat->firstName + ' ' + chat->lastName;
		f.Username = chat->username;
	}

	resp.status = 200;
	resp.set_content(nlohmann::json(friends).dump(), "application/json");
}

void HttpApiServer::GetToken(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthByBot(req)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	resp.set_content(m_DB.GetToken(id), "text/plain");
	resp.status = 200;
}

void HttpApiServer::NewChallenge(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto challenge = GetJsonObject<Challenge>(req.body);

	if (!challenge.has_value() || !challenge.value().Validate(id)) {
		Fail(resp, "Challenge is invalid or incomplete");
		return;
	}

	auto today = DateUtils::Now();

	const auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	std::int64_t challenge_id = m_DB.AddChallenge(std::move(challenge.value()));
	m_DB.JoinChallenge(id, challenge_id, today);
	m_DB.SaveChallengeToFile(challenge_id);

	Ok(resp, "Challenge added");
}

void HttpApiServer::JoinChallenge(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t challenge = GetIdParam(req, "challenge").value_or(0);

	if (!id || !challenge) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}
	
	auto today = DateUtils::Now();

	const auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	if(m_DB.JoinChallenge(id, challenge, today)){
		m_DB.SaveChallengeToFile(challenge);
		
		Ok(resp, "Joined challenge");
		return;
	}
	
	Fail(resp, "Failed to join challenge");
}

void HttpApiServer::LeaveChallenge(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t challenge = GetIdParam(req, "challenge").value_or(0);

	if (!id || !challenge) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}
	
	auto today = DateUtils::Now();

	const auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	if(m_DB.LeaveChallenge(id, challenge, today)){
		m_DB.SaveChallengeToFile(challenge);
		
		Ok(resp, "Left challenge");
		return;
	}
	
	Fail(resp, "Failed to leave challenge");
}

void HttpApiServer::GetChallengeParticipants(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t challenge = GetIdParam(req, "challenge").value_or(0);

	if (!id || !challenge) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id) || !m_DB.IsInChallenge(id, challenge)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();

	auto participants = m_DB.GetChallengeParticipant(challenge, today, 
	[&](std::int64_t user) -> std::string {
		try {
			auto chat = m_Bot.getApi().getChat(user);

			return chat->firstName + ' ' + chat->lastName;
		} catch (...) {
			return "";
		}
	},
	[&](std::int64_t user) -> std::string {
		try {
			auto chat = m_Bot.getApi().getChat(user);

			return chat->username;
		} catch (...) {
			return "";
		}
	}
	);
	
	resp.status = 200;
	resp.set_content(nlohmann::json(participants).dump(), "application/json");
}

void HttpApiServer::GetChallengeInviteParticipantsPreview(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t challenge = GetIdParam(req, "challenge").value_or(0);

	if (!id || !challenge) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();

	auto NoString = [](std::int64_t user) -> std::string { return ""; };

	auto participants = m_DB.GetChallengeParticipant(challenge, today, NoString, NoString);
	
	resp.status = 200;
	resp.set_content(nlohmann::json(participants).dump(), "application/json");
}

void HttpApiServer::GetChallengeInvitePreview(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t challenge = GetIdParam(req, "challenge").value_or(0);

	if (!id || !challenge) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();

	const auto &challenges = m_DB.Challenges();

	if (!challenges.count(challenge)) {
		resp.status = httplib::StatusCode::NotFound_404;
		return;
	}

	if (!challenges.at(challenge).CanJoin(today)) {
		resp.status = httplib::StatusCode::Forbidden_403;
		return;
	}

	resp.status = 200;
	resp.set_content(nlohmann::json(challenges.at(challenge)).dump(), "application/json");
}

static std::vector<std::string> FilterDescrs(std::vector<std::string> descrs) {
	while (descrs.size() > 2) {
		std::swap(descrs[rand() % descrs.size()], descrs.back());
		descrs.pop_back();
	}
	return descrs;
}

const std::string& HttpApiServer::GetOrGenerateExtended(const std::vector<std::string>& descrs){
	std::string key = nlohmann::json(descrs).dump();
	
	if(m_ExtendedCache.count(key))
		return m_ExtendedCache[key];

	const auto system = R"(
You are a joke quote generation system that should give a people with different joke goals jokeful inspiration to keep going. 
You can inspire by highlighting benefits of following goal and negative effects of not following the goal. 
All goals are purely jokes, so if goal is to drink beer daily, you should encourage it to do so.
I give you array of goals, you respond with a motivational quote. 
You can make a single abstract quote about success from the whole array.

Quote should be simple and short, one sentence long. 
You can skip some things in order to fix the length requirements. 
Don't use quotation characters. Give quote straight away
)";

	std::string array = nlohmann::json(FilterDescrs(descrs)).dump();
	
	auto response = OpenAI::Complete(m_OpenAIKey, {{OpenAI::Role::System, system},{OpenAI::Role::User, array}}, 1.f, "gpt-4o-mini");
	
	static std::string Fallback = "Keep it going!";
	if(!response.has_value())
		return Fallback;
	
	return (m_ExtendedCache[key] = response.value());
}

void HttpApiServer::RegenerateExtendedCache(){
	m_ExtendedCache.clear();

	auto today = DateUtils::Now();
	
	for (std::int64_t id: m_DB.GetUsers()) {
		auto &user = m_DB.GetUser(id, today);
		auto challenges = m_DB.ChallengesWithoutIds(id);

		auto descrs = m_DB.ActiveStreaksDescriptions(id, today);

		GetOrGenerateExtended(descrs);
	}
}

void HttpApiServer::OnDayAlmostOver(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();

	for (const auto &[challenge_id, challenge] : m_DB.Challenges()) {
		if(challenge.GetStatus(today) != ChallengeStatus::Running)
			continue;

		for (std::int64_t user_id : challenge.GetParticipants()) {
			
			if(!m_DB.CommitedChallengeAt(user_id, challenge_id, today) && !m_DB.HasLost(user_id, challenge_id, today)){
				m_Notifications.push_back({
					user_id,
					Format("😡 You're about to lose in '%' challenge, commit instead!", challenge.GetName()),
					today
				});
			}
		}
	}

	for (auto id: m_DB.GetUsers()) {
		auto &user = m_DB.GetUser(id, today);

		if(m_DB.ActiveProtected(id, today))
			continue;

		if (!m_DB.ActiveProtected(id, today) && m_DB.ActiveProtected(id, DateUtils::Yesterday(today)) && m_DB.ActiveStreak(id, today)) {
			bool can_be_freezed = user.HasSomethingToFreeze(today) && user.AvailableFreezes(today).size();

			std::string message = 
				can_be_freezed
					? Format(UTF8("😡 The day is almost over! Don't waste your streak freeze, commit instead!"))
					: Format(UTF8("😡 The day is almost over, don't lose your % days streak!"), m_DB.ActiveStreak(id, today));

			m_Notifications.push_back({id, message, today});
			continue;
		} 
	}
}

void HttpApiServer::OnMomentBeforeNewDay(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();

	for (const auto &[challenge_id, challenge] : m_DB.Challenges()) {
		if(challenge.GetStatus(today) != ChallengeStatus::Running)
			continue;

		for (std::int64_t user_id : challenge.GetParticipants()) {
			
			if(!m_DB.CommitedChallengeAt(user_id, challenge_id, today) && !m_DB.HasLost(user_id, challenge_id, today)){
				m_Notifications.push_back({
					user_id,
					Format("😱 You're about to lose in '%' challenge!!! Commit now!", challenge.GetName()),
					today
				});
			}
		}
	}

	for (auto id: m_DB.GetUsers()) {
		auto &user = m_DB.GetUser(id, today);

		if(m_DB.ActiveProtected(id, today))
			continue;

		if (!m_DB.ActiveProtected(id, today) && m_DB.ActiveProtected(id, DateUtils::Yesterday(today)) && m_DB.ActiveStreak(id, today)) {
			bool can_be_freezed = user.HasSomethingToFreeze(today) && user.AvailableFreezes(today).size();

			std::string message = 
				can_be_freezed
					? Format(UTF8("😱 Can't wait anymore!!! Commit now or lose your streak freeze!"))
					: Format(UTF8("😱 Can't wait anymore!!! Commit now or lose your % days streak!"), m_DB.ActiveStreak(id, today));

			m_Notifications.push_back({id, message, today});
			continue;
		} 
	}
}

void HttpApiServer::OnNewDay(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();
	auto yesterday = DateUtils::Yesterday(today);

	for (const auto &[challenge_id, challenge] : m_DB.Challenges()) {
		for (std::int64_t user_id : challenge.GetParticipants()) {
			
			if(m_DB.HasLost(user_id, challenge_id, today) && !m_DB.HasLost(user_id, challenge_id, yesterday))
				m_Notifications.push_back({
					user_id,
					Format("😭 You've lost in '%' challenge...", challenge.GetName()),
					today
				});
		}
	}

	for (auto id: m_DB.GetUsers()) {
		const auto &user = m_DB.GetUser(id, today);
		
		auto freezes = user.AvailableFreezes(today);

		for (auto freeze : freezes) {
			if (!user.CanUseFreezeAt(freeze, DateUtils::Tomorrow(today))) {
				m_Notifications.push_back({
					id,
					UTF8("👀 Today is the last day for one of your streak freezes, use it right now!"),
					today
				});
				break;
			}
		}

		if (user.IsFreezedByAt(yesterday, FreezeUsedBy::Auto)) {
			m_Notifications.push_back({
				id,
				Format(UTF8("🥶 Whoa, saved your % days streak with a freeze, be careful next time!"), m_DB.ActiveStreak(id, today)),
				today
			});
		}

		if (m_DB.ActiveStreak(id, yesterday) && !m_DB.ActiveProtected(id, yesterday)) {
			auto active = m_DB.ActiveStreaks(id, today);

			m_Notifications.push_back({
				id,
				Format(UTF8("😭 You've lost your % days active streak...\n😜 Remember that you still have % streaks to protect!"), m_DB.ActiveStreak(id, yesterday), active.size()),
				today
			});
		}
	}

	m_Notifications.push_back({Jeytery, UTF8("😡 Streak is not active."), today});
	
	if(m_RegenerateExtendedCache)
		RegenerateExtendedCache();
}

void HttpApiServer::GetNotifications(const httplib::Request& req, httplib::Response& resp){
	if (!IsAuthByBot(req)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	resp.status = 200;
	resp.set_content(nlohmann::json(m_Notifications).dump(), "application/json");
	m_Notifications.clear();
}


std::string ToTagLink(const std::string& tag) {
	return "https://t.me/" + tag;
}

std::string ToLink(const std::string& tag) {
	return Format("<a href=\"%\">%</a>", ToTagLink(tag), tag);
}

void HttpApiServer::NudgeFriend(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t friend_id= GetIdParam(req, "friend").value_or(0);

	if (!id || !friend_id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!IsAuthForUser(req, id)) {
		resp.status = httplib::StatusCode::Unauthorized_401;
		return;
	}

	auto today = DateUtils::Now();
	auto &friend_user = m_DB.GetUser(friend_id, today);
	auto &user = m_DB.GetUser(id, today);

	if (!friend_user.HasFriend(id))
		return Fail(resp, "Can't nudge, this user is not a friend");

	auto from = m_Bot.getApi().getChat(id);

	if(!from)
		return Fail(resp, "Can't fetch your chat info");

	std::string message = Format("%: ", ToLink(from->username));
	
	message += req.body;

	m_Notifications.push_back({
		friend_id,
		message,
		today
	});

	Ok(resp, "Nudged!");
}

