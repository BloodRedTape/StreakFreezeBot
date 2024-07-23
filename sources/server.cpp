#include "server.hpp"
#include "model.hpp"
#include "http.hpp"
#include <bsl/log.hpp>

DEFINE_LOG_CATEGORY(HttpApiDebug)
DEFINE_LOG_CATEGORY(HttpApiServer)

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
	m_DB(config),
	m_QuoteApiKey(
		config.Get("QuoteApi", "Key", "")
	),
	m_Bot(
		config.Get("Bot", "Token", "")
	)
{
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

	Get ("/tg/user/:id/:item", &ThisClass::GetTg);

	set_exception_handler([](const auto& req, auto& res, std::exception_ptr ep) {
		std::string content;
		try {
			std::rethrow_exception(ep);
		} catch (std::exception &e) {
			content = e.what();
		} catch (...) {
			content = "Unknown exception";
		}

		LogHttpApiServer(Fatal, "%", content);

		res.set_content(Format("<h1>Error 500</h1><p>%</p>", content), "text/html");
		res.status = httplib::StatusCode::InternalServerError_500;
	});

	m_LastUpdate = std::chrono::steady_clock::now() - std::chrono::minutes(m_QuoteUpdateMinutes);
}

void HttpApiServer::Run(){
	Super::listen(m_Hostname, m_Port);
}

void HttpApiServer::GetFullUser(const httplib::Request& req, httplib::Response& resp){
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());

	const auto &user = m_DB.GetUser(id);

	auto user_json = nlohmann::json(user);
	to_json(user_json["Today"], DateUtils::Now());
	to_json(user_json["Streak"], m_DB.Streak(id));

	std::string content = user_json.dump();

	resp.status = httplib::StatusCode::OK_200;
	resp.set_content(content, "application/json");
}

void HttpApiServer::Commit(const httplib::Request& req, httplib::Response& resp) {
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());
	
	if(m_DB.IsCommitedToday(id))
		return Fail(resp, "Already commited today, don't overtime!");

	if(m_DB.IsFreezedToday(id))
		return Fail(resp, "Freeze is already used!");

	if (!m_DB.Commit(id))
		return Fail(resp, "Something wrong");

	Ok(resp, Format("Whoa, extended streak to % days", m_DB.Streak(id)));
}

void HttpApiServer::UseFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	auto freeze_id = GetJsonProperty<std::int64_t>(req.body, "freeze_id");

	if (!id || !freeze_id.has_value()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	if(m_DB.IsProtectedToday(id))
		return Fail(resp, "Can't use freeze today, already protected!");

	std::optional<StreakFreeze> freeze = m_DB.UseFreeze(id, freeze_id.value());
	
	if (!freeze.has_value())
		return Fail(resp, "You don't have freezes to use for today");

	Ok(resp, Format("Nice, you left with % freezes and protected your % days streak", m_DB.AvailableFreezes(id).size(), m_DB.Streak(id)));
}

void HttpApiServer::AddFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	std::string reason = GetJsonPropertyOr<std::string>(req.body, "reason", "For no good reason");
	std::int64_t expire = GetJsonPropertyOr<std::int64_t>(req.body, "expire", 4);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	if (!m_DB.CanAddFreeze(id))
		return Fail(resp, "Reached maximum amount of freezes");

	m_DB.AddFreeze(id, expire, std::move(reason));

	Ok(resp, Format("Added streak freeze, % now", m_DB.AvailableFreezes(id).size()));
}

void HttpApiServer::RemoveFreeze(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);
	auto freeze_id = GetJsonProperty<std::int64_t>(req.body, "freeze_id");

	if (!id || !freeze_id.has_value()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	m_DB.RemoveFreeze(id, freeze_id.value());
}

void HttpApiServer::GetAvailableFreezes(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetUser(req).value_or(0);

	if (!id) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}
	
	resp.set_content(nlohmann::json(m_DB.AvailableFreezes(id)).dump(), "application/json");
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

		nlohmann::json body = HttpGetJson(url, "/v1/quotes?category=success", {
			{"X-Api-Key", m_QuoteApiKey}
		});

		std::string quote = body.is_array()
			? body.front().dump() 
			: R"({ "quote": "There is nothing better that extending your streak"})";
		
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

	auto friends = m_DB.GetFriendsInfo(id);

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
	
	const auto &users = m_DB.Users();

	if (!users.count(id)) {
		resp.status = httplib::StatusCode::NotFound_404;
		return;
	}

	const auto &user = users.at(id);
	
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
                resp.status = httplib::StatusCode::NotFound_404;
                resp.set_content("No profile photos found", "text/plain");
                return;
            }

            std::string fileId = photos->photos[0][0]->fileId;

            TgBot::File::Ptr file = m_Bot.getApi().getFile(fileId);

            std::string fileUrl = "https://api.telegram.org/file/bot" + m_Bot.getToken() + "/" + file->filePath;
            httplib::Client cli("https://api.telegram.org");
            auto res = cli.Get(fileUrl.c_str());

            if (res && res->status == 200) {
                resp.status = httplib::StatusCode::OK_200;
                resp.set_content(res->body, "image/jpeg");
            } else {
                resp.status = httplib::StatusCode::InternalServerError_500;
                resp.set_content("Failed to download photo", "text/plain");
            }
        } catch (const std::exception& e) {
            resp.status = httplib::StatusCode::InternalServerError_500;
            resp.set_content(e.what(), "text/plain");
        }

        return;
    }

	resp.status = httplib::StatusCode::BadRequest_400;
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
