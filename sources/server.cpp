#include "server.hpp"
#include "model.hpp"
#include "http.hpp"
#include <bsl/log.hpp>
#include <bsl/defer.hpp>

DEFINE_LOG_CATEGORY(HttpApiDebug)
DEFINE_LOG_CATEGORY(HttpApiServer)
DEFINE_LOG_CATEGORY(TelegramBridge)

void Fail(httplib::Response &resp, const std::string &error) {
	resp.set_content(nlohmann::json::object({{"Fail", error}}).dump(), "application/json");
	resp.status = httplib::StatusCode::OK_200;
};
void Ok(httplib::Response &resp, const std::string &error) {
	resp.set_content(nlohmann::json::object({{"Ok", error}}).dump(), "application/json");
	resp.status = httplib::StatusCode::OK_200;
};

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
	m_QuoteApiKey(
		config.Get("QuoteApi", "Key", "")
	),
	m_Bot(
		config.Get("Bot", "Token", "")
	),
	m_Logger(config)
{
	Super::set_mount_point("/config/", m_WebAppConfigPath);
	Super::set_mount_point("/", m_WebAppPath);
	
	Get ("/user/:id/full", &ThisClass::GetFullUser);
	Post("/debug/log", &ThisClass::PostDebugLog);
	Post("/user/:id/commit",	 &ThisClass::Commit);
	Post("/user/:id/add_freeze", &ThisClass::AddFreeze);
	Post("/user/:id/use_freeze", &ThisClass::UseFreeze);
	Post("/user/:id/remove_freeze", &ThisClass::RemoveFreeze);
	Get ("/user/:id/available_freezes", &ThisClass::GetAvailableFreezes);
	Post("/user/:id/reset_streak", &ThisClass::ResetStreak);
	Get ("/quote", &ThisClass::GetQuote);
	Get ("/user/:id/friends", &ThisClass::GetFriends);
	Post("/user/:id/friends/accept/:from", &ThisClass::AcceptFriendInvite);
	Post("/user/:id/friends/remove/:from", &ThisClass::RemoveFriend);

	Get ("/user/:id/todo/persistent", &ThisClass::GetPersistentTodo);
	Post("/user/:id/todo/persistent", &ThisClass::SetPersistentTodo);
	Get ("/user/:id/todo/persistent/completion", &ThisClass::GetPersistentCompletion);
	Post("/user/:id/todo/persistent/completion", &ThisClass::SetPersistentCompletion);

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

	m_LastUpdate = std::chrono::steady_clock::now() - std::chrono::minutes(m_QuoteUpdateMinutes);
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

	auto today = DateUtils::Now();
	const auto &user = m_DB.GetUser(id, today);

	//NOTE: History is first because it corrects all the other info
	auto user_json = nlohmann::json(user);
	user_json["History"] = user.HistoryForToday(today);
	user_json["Today"] = DateUtils::Now();
	user_json["Streak"] = user.Streak(today);
	user_json["StreakStart"] = user.FirstCommitDate().value_or(today);

	std::string content = user_json.dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(content, "application/json");
}

void HttpApiServer::Commit(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	if(user.IsCommitedAt(today))
		return Fail(resp, "Already commited today, don't overtime!");

	if(user.IsFreezedAt(today))
		return Fail(resp, "Freeze is already used!");

	if (!user.Commit(today))
		return Fail(resp, "Something wrong");

	Ok(resp, Format("Whoa, extended streak to % days", m_DB.Streak(id, today)));
}

void HttpApiServer::UseFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	auto freeze_id = GetJsonProperty<std::int64_t>(req.body, "freeze_id");

	if (!id || !freeze_id.has_value()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };
	
	if(user.IsProtected(today))
		return Fail(resp, "Can't use freeze today, already protected!");

	if(user.NoStreak(today))
		return Fail(resp, "Can't use freeze without a streak!");

	std::optional<std::int64_t> freeze = user.UseFreeze(today, freeze_id.value(), FreezeUsedBy::User);
	
	if (!freeze.has_value())
		return Fail(resp, "You don't have freezes to use for today");

	Ok(resp, Format("Nice, you left with % freezes and protected your % days streak", user.AvailableFreezes(today).size(), user.Streak(today)));
}

void HttpApiServer::AddFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	std::string reason = GetJsonPropertyOr<std::string>(req.body, "reason", "For no good reason");
	std::int64_t expire = GetJsonPropertyOr<std::int64_t>(req.body, "expire", 4);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
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

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	
	resp.set_content(nlohmann::json(user.AvailableFreezes(today)).dump(), "application/json");
}

void HttpApiServer::ResetStreak(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	m_DB.ResetStreak(id);
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

void HttpApiServer::PostDebugLog(const httplib::Request& req, httplib::Response& resp){
	LogHttpApiDebug(Display, "%", req.body);
	resp.status = 200;
}

void HttpApiServer::GetQuote(const httplib::Request& req, httplib::Response& resp){
	
	auto now = std::chrono::steady_clock::now();

	auto duration = std::chrono::duration_cast<std::chrono::minutes>(now - m_LastUpdate);
	
	if(duration >= std::chrono::minutes(m_QuoteUpdateMinutes)){
		const auto url = "https://api.api-ninjas.com";

		auto body = HttpGetJson(url, "/v1/quotes?category=success", {
			{"X-Api-Key", m_QuoteApiKey}
		});

		const std::string backing_quote = R"({ "quote": "There is nothing better that extending your streak"})";

		std::string quote;

		if (body.is_array()) {
			quote = body.front().dump();
		} else {
			LogHttpApiServer(Error, "Quote got unparsable response: %\nusing fallback quote", body.dump());
			quote = backing_quote;
		}
		
		m_LastQuote = quote;
		m_LastUpdate = now;
	}

	resp.status = 200;
	resp.set_content(m_LastQuote, "application/json");
}

void HttpApiServer::AcceptFriendInvite(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::int64_t from = GetIdParam(req, "from").value_or(0);

	if (!id || !from) {
		resp.status = httplib::StatusCode::BadRequest_400;
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

	m_DB.RemoveFriends(id, from);

	Ok(resp, "Removed friend");
}


void HttpApiServer::GetFriends(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
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

	if (item == "full") {
		auto chat = m_Bot.getApi().getChat(id);
		
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
				LogTelegramBridge(Error, "No profile photos found for: %", id);
                resp.status = httplib::StatusCode::NotFound_404;
                resp.set_content("No profile photos found", "text/plain");
                return;
            }

            std::string fileId = photos->photos[0][0]->fileId;

			const auto &content = GetOrDownloadTgFile(fileId);

            if (content.size()) {
                resp.status = httplib::StatusCode::OK_200;
                resp.set_content(content, "image/jpeg");
            } else {
                resp.status = httplib::StatusCode::NotFound_404;
                resp.set_content("Failed to download photo", "text/plain");
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

void HttpApiServer::GetPersistentTodo(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);

	auto todo = user.GetPersistentTodo(today);

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(nlohmann::json(todo).dump(), "application/json");
}

void HttpApiServer::SetPersistentTodo(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	std::optional<ToDoDescription> description = GetJsonObject<ToDoDescription>(req.body);

	if (!description.has_value()) {
		resp.status = httplib::StatusCode::Conflict_409;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	if(user.GetPersistentTodo(today).IsRunning())
		return Fail(resp, "Trying to override already running ToDo");

	if(!user.SetPersistentTodo(today, description.value()))
		return Fail(resp, "Internal error during ToDo setup");

	Ok(resp, "ToDo is now set!");
}

void HttpApiServer::GetPersistentCompletion(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);

	auto completion = user.TodayPersistentCompletion(today);

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(nlohmann::json(completion).dump(), "application/json");
}

void HttpApiServer::SetPersistentCompletion(const httplib::Request& req, httplib::Response& resp){
	std::int64_t id = GetIdParam(req, "id").value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	auto completion = GetJsonProperty<std::vector<std::int8_t>>(req.body, "Checks");

	if (!completion.has_value()) {
		resp.status = httplib::StatusCode::Conflict_409;
		return;
	}

	auto today = DateUtils::Now();
	auto &user = m_DB.GetUser(id, today);
	defer{ m_DB.SaveUserToFile(id); };

	if(!user.SetPersistentCompletion(today, completion.value()))
		return Fail(resp, "Internal error during ToDo setup");

	Ok(resp, "ToDo is now set!");
}

void HttpApiServer::OnDayAlmostOver(const httplib::Request& req, httplib::Response& resp){
	auto today = DateUtils::Now();

	for (auto id: m_DB.GetUsers()) {
		auto &user = m_DB.GetUser(id, today);

		if(user.IsProtected(today))
			continue;

		if (!user.IsProtected(today) && user.IsProtected(DateUtils::Yesterday(today))) {
			bool can_be_freezed = user.AvailableFreezes(today).size();

			std::string message = 
				can_be_freezed
					? Format("The day is almost over! Don't waste your streak freeze, commit instead!")
					: Format("The day is almost over, don't lose your % days streak!", user.Streak(today));

			m_Notifications.push_back({id, message, today});
			continue;
		} 
		
		if (user.TodayPersistentCompletion(today).Checks.size()) {
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
				Format("Whoa, saved your % days streak with a freeze, be careful next time!", user.Streak(today)),
				today
			});
		}

		if (user.Streak(yesterday) && !user.IsProtected(yesterday)) {
			m_Notifications.push_back({
				id,
				Format("You've lost your % days streak... At least now you can setup a new ToDo list", user.Streak(yesterday)),
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

	auto today = DateUtils::Now();
	auto &friend_user = m_DB.GetUser(friend_id, today);
	auto &user = m_DB.GetUser(id, today);

	if (!friend_user.HasFriend(id))
		return Fail(resp, "Can't nudge, this user is not a friend");

	auto from = m_Bot.getApi().getChat(id);

	if(!from)
		return Fail(resp, "Can't fetch your chat info");

	std::string message = Format("%: ", ToLink(from->username));

	if (friend_user.NoStreak(today)){
		if(user.Streak(today))
			message += "Hey, still no streak? Join me!";
		else
			message += "Hey, still no streak?";
	} else if (friend_user.IsProtected(today)){
		if(user.IsProtected(today))
			message += "We've both commited today, cool!";
		else
			message += "Protected streak, great!";
	} else {
		if(user.IsProtected(today))
			message += "I've already commited today, join me!";
		else
			message += "Wanna throw away your streak?";
	}
	
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
