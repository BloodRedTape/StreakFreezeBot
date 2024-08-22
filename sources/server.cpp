#include "server.hpp"
#include "model.hpp"
#include "http.hpp"
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <hmac_sha256.h>
#include "openai.hpp"

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
	m_WebAppConfigPath(
		config.Get(SectionName, "WebAppConfigPath", ".")
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
	Super::set_mount_point("/config/", m_WebAppConfigPath);
	Super::set_mount_point("/", m_WebAppPath);
	
	Get ("/user/:id/full", &ThisClass::GetFullUser);
	Post("/debug/log", &ThisClass::PostDebugLog);
	Post("/user/:id/commit", &ThisClass::Commit);
	Post("/user/:id/add_streak", &ThisClass::AddStreak);
	Post("/user/:id/remove_streak", &ThisClass::RemoveStreak);
	Get ("/user/:id/pending_submition", &ThisClass::GetPendingSubmition);
	Post("/user/:id/pending_submition", &ThisClass::PostPendingSubmition);
	Post("/user/:id/add_freeze", &ThisClass::AddFreeze);
	Post("/user/:id/use_freeze", &ThisClass::UseFreeze);
	Post("/user/:id/remove_freeze", &ThisClass::RemoveFreeze);
	Get ("/user/:id/available_freezes", &ThisClass::GetAvailableFreezes);
	Get ("/quote", &ThisClass::GetQuote);
	Post("/quote/invalidate", &ThisClass::PostInvalidateQuote);
	Post("/quote/push", &ThisClass::PostPushQuote);
	Get ("/user/:id/friends", &ThisClass::GetFriends);
	Post("/user/:id/friends/accept/:from", &ThisClass::AcceptFriendInvite);
	Post("/user/:id/friends/remove/:from", &ThisClass::RemoveFriend);

	Get ("/tg/user/:id/:item", &ThisClass::GetTg);

	Post("/timer/day_almost_over", &ThisClass::OnDayAlmostOver);
	Post("/timer/new_day", &ThisClass::OnNewDay);

	Get ("/notifications", &ThisClass::GetNotifications);

	Post("/user/:id/nudge/:friend", &ThisClass::NudgeFriend);

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

	m_LastUpdate = std::chrono::steady_clock::now() - 2 * std::chrono::minutes(m_QuoteUpdateMinutes);
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

	auto StreakToJson = [user, today](const Streak &streak, std::int64_t id) {
		return nlohmann::json({ 
			{"Description", streak.Description},
			{"History", streak.HistoryForToday(today, user.GetFreezes())},
			{"Start", streak.FirstCommitDate().value_or(today)},
			{"Count", streak.Count(today, user.GetFreezes())},
			{"Id", id}
		});
	};

	//NOTE: History is first because it corrects all the other info
	auto user_json = nlohmann::json(user);
	user_json["History"] = user.ActiveHistoryForToday(today);
	user_json["Today"] = DateUtils::Now();
	user_json["Streak"] = user.ActiveCount(today);
	user_json["StreakStart"] = user.FirstCommitEver().value_or(today);
	user_json["Streaks"] = nlohmann::json::array();
	
	const auto &streaks = user.GetStreaks();
	for (auto i = 0; i<streaks.size(); i++){
		const auto &streak = streaks[i];

		if(streak.Status != StreakStatus::Removed)
			user_json["Streaks"].push_back(StreakToJson(streak, i));
	}

	std::string content = user_json.dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(content, "application/json");
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

	for (std::int64_t streak_id: streaks) {
		auto *streak = user.GetStreak(streak_id);

		if(!streak)
			continue;

		streak->Status = StreakStatus::Removed;
	}
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

	if(user.IsFreezedAt(today))
		return Fail(resp, "Freeze is already used!");

	const auto initialAreActiveCommited = user.AreActiveCommited(today);

	std::string error;
	
	for(auto streak_id: streaks){
		auto *streak = user.GetStreak(streak_id);

		if(!streak){
			error += "Invalid streak Id\n";
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
	
	if (initialAreActiveCommited == user.AreActiveCommited(today))
		return Ok(resp, "commited");

	auto descrs = user.ActiveStreakDescriptions(today);

	const auto system = R"(
You are a quote generation system that should give a people with different goals inspiration to keep going. 
You can inspire by highlighting benefits of following goal and negative effects of not following the goal. 
I give you array of goals, you respond with a motivational quote. 

Quote should be simple and short, one sentence long. 
You can skip some things in order to fix the length requirements. 
Don't use quotation characters. Give quote straight away
)";

	std::string array = nlohmann::json(descrs).dump();
	
	auto response = OpenAI::Complete(m_OpenAIKey, {{OpenAI::Role::System, system},{OpenAI::Role::User, array}}, 1.f, "gpt-4o-mini");

	nlohmann::json data = nlohmann::json({ 
		{"Comment", response.value_or("Keep it going!")}
	});
	
	Data(resp, data);
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
	
	if(user.AreActiveProtected(today))
		return Fail(resp, "Can't use freeze today, already protected!");

	if(!user.ActiveStreaks(today).size())
		return Fail(resp, "Can't use freeze without a streak!");

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

std::optional<std::int64_t> HttpApiServer::GetIdParam(const httplib::Request& req, const std::string &name)const {
	if (!req.path_params.count(name))
		return std::nullopt;

	const std::string &user_id = req.path_params.at(name);
	errno = 0;
	std::int64_t id = std::atoll(user_id.c_str());
	if(errno)
		return std::nullopt;

	return id;
}

std::optional<std::string> HttpApiServer::GetParam(const httplib::Request& req, const std::string& name)const {
	if (!req.path_params.count(name))
		return std::nullopt;

	return req.path_params.at(name);
}

static std::string HMAC_SHA256(const std::string& data, const std::string& key) {
	std::string result(32, '/0');
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

bool HttpApiServer::IsAuthForUser(const httplib::Request &req, std::int64_t user) const{
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

void HttpApiServer::GetTg(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::string item = GetParam(req, "item").value_or("");

	if (!id || !item.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	const auto &user = m_DB.GetUser(id, today);

	auto chat = m_Bot.getApi().getChat(id);

	if (item == "full") {
		
		nlohmann::json json = { 
			{"Username", chat->username},
			{"FullName", chat->firstName + ' ' + chat->lastName},
		};
		
		resp.status = httplib::StatusCode::OK_200;
		resp.set_content(json.dump(), "application/json");
		return;
	}

    if (item == "photo") {
        try {
            TgBot::UserProfilePhotos::Ptr photos = m_Bot.getApi().getUserProfilePhotos(id);

            if (photos->totalCount == 0) {
				auto placeholder = GetOrDownloadPlaceholder(chat->firstName, chat->lastName);
			
				if (placeholder.size()) {
					resp.status = httplib::StatusCode::OK_200;
					resp.set_content(placeholder, "image/png");
				}else{
					resp.status = httplib::StatusCode::NotFound_404;
					resp.set_content("Failed to fetch avatar", "text/plain");
				}

                return;
            }

            std::string fileId = photos->photos[0][0]->fileId;

			const auto &content = GetOrDownloadTgFile(fileId);

            if (content.size()) {
                resp.status = httplib::StatusCode::OK_200;
                resp.set_content(content, "image/jpeg");
            } else {
				resp.status = httplib::StatusCode::NotFound_404;
				resp.set_content("Failed to fetch telegram avatar", "text/plain");
            }
        } catch (const std::exception& e) {
			LogTelegramBridge(Error, "Crashed on photo fetch: %", e.what());
            resp.status = httplib::StatusCode::InternalServerError_500;
            resp.set_content(e.what(), "text/plain");
        }

        return;
    }

	LogTelegramBridge(Error, "Bad request: item %, id %", item, id);
	resp.status = httplib::StatusCode::BadRequest_400;
}

const std::string& HttpApiServer::GetOrDownloadTgFile(const std::string& id) {
	if(m_TelegramCache.count(id))
		return m_TelegramCache[id];

    TgBot::File::Ptr file = m_Bot.getApi().getFile(id);

    std::string fileUrl = "https://api.telegram.org/file/bot" + m_Bot.getToken() + "/" + file->filePath;
    httplib::Client cli = MakeSecureClient("https://api.telegram.org");
    auto res = cli.Get(fileUrl.c_str());

    if (res && res->status == 200) 
		return (m_TelegramCache[id] = res->body);
	
	LogTelegramBridge(Error, "Photo fetch request failed with: %", res ? res->body : httplib::to_string(res.error()));
	
	static std::string Empty = "";
	return Empty;
}

const std::string& HttpApiServer::GetOrDownloadPlaceholder(const std::string& first, const std::string &last){
	const std::string key = first + "+" + last;

	if(m_PlaceholdersCache.count(key))
		return m_PlaceholdersCache[key];


	auto fallback = HttpGet("https://avatar.iran.liara.run", Format("/username?username=%", key));


	if (fallback.has_value())
		return (m_PlaceholdersCache[key] = std::move(fallback.value()));
	
	static std::string Empty = "";
	return Empty;
}

void HttpApiServer::OnDayAlmostOver(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();

	for (auto id: m_DB.GetUsers()) {
		auto &user = m_DB.GetUser(id, today);

		if(user.AreActiveProtected(today))
			continue;

		if (!user.AreActiveProtected(today) && user.AreActiveProtected(DateUtils::Yesterday(today))) {
			bool can_be_freezed = user.AvailableFreezes(today).size();

			std::string message = 
				can_be_freezed
					? Format("The day is almost over! Don't waste your streak freeze, commit instead!")
					: Format("The day is almost over, don't lose your % days streak!", user.ActiveCount(today));

			m_Notifications.push_back({id, message, today});
			continue;
		} 
		
		if (user.ActivePendingStreaks(today).size()) {
			m_Notifications.push_back({id, "Don't let go, finish what you've started!", today});
			continue;
		}
	}
}

void HttpApiServer::OnNewDay(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();
	auto yesterday = DateUtils::Yesterday(today);


	for (auto id: m_DB.GetUsers()) {
		const auto &user = m_DB.GetUser(id, today);
		
		auto freezes = user.AvailableFreezes(today);

		for (auto freeze : freezes) {
			if (!user.CanUseFreezeAt(freeze, DateUtils::Tomorrow(today))) {
				m_Notifications.push_back({
					id,
					"Today is the last day for one of your streak freezes, use it right now!",
					today
				});
				break;
			}
		}

		if (user.IsFreezedByAt(yesterday, FreezeUsedBy::Auto)) {
			m_Notifications.push_back({
				id,
				Format("Whoa, saved your % days streak with a freeze, be careful next time!", user.ActiveCount(today)),
				today
			});
		}

		if (user.ActiveCount(yesterday) && !user.AreActiveProtected(yesterday)) {
			auto active = user.ActiveStreaks(today);

			m_Notifications.push_back({
				id,
				Format("You've lost your % days active streak...\nRemember that you still have % streaks to protect!", user.ActiveCount(yesterday), active.size()),
				today
			});
		}
	}
}

void HttpApiServer::GetNotifications(const httplib::Request& req, httplib::Response& resp){
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

HttpApiServer& HttpApiServer::Get(const std::string& pattern, HttpApiHandler handler){
	Super::Get(pattern, std::bind(handler, this, std::placeholders::_1, std::placeholders::_2));
	return *this;
}

HttpApiServer& HttpApiServer::Post(const std::string& pattern, HttpApiHandler handler){
	httplib::Server::Handler h = std::bind(handler, this, std::placeholders::_1, std::placeholders::_2);
	Super::Post(pattern, h);
	return *this;
}
