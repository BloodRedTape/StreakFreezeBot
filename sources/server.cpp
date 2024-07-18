#include "server.hpp"
#include "model.hpp"
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

template<typename T>
std::optional<T> GetJsonProperty(const std::string &json_string, const std::string &property) {
	auto json = nlohmann::json::parse(json_string, nullptr, false, false);

	if(!json.count(property))
		return std::nullopt;

	return json[property].get<T>();
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
	m_DB(config)
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

	std::string content = nlohmann::json(user).dump();

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

	if(m_DB.IsStreakBurnedOut(id)){
		m_DB.ResetStreak(id);
		return Fail(resp, "Streak is burned out, reset");
	}

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

	if(m_DB.IsStreakBurnedOut(id))
		return Fail(resp, "Streak is already burned out, nothing to freeze.");

	std::optional<StreakFreeze> freeze = m_DB.UseFreeze(id, freeze_id.value());
	
	if (!freeze.has_value())
		return Fail(resp, "You don't have freezes to use for today");

	Ok(resp, Format("Nice, you left with % freezes and protected your % days streak", m_DB.AvailableFreezes(id).size(), m_DB.Streak(id)));
}

void HttpApiServer::AddFreeze(const httplib::Request& req, httplib::Response& resp) {
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());
	
	if (!m_DB.CanAddFreeze(id))
		return Fail(resp, "Reached maximum amount of freezes");

	m_DB.AddFreeze(id, 4);

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
	if (!req.path_params.count("id"))
		return std::nullopt;

	const std::string &user_id = req.path_params.at("id");
	errno = 0;
	std::int64_t id = std::atoll(user_id.c_str());
	if(errno)
		return std::nullopt;

	return id;
}

void HttpApiServer::PostDebugLog(const httplib::Request& req, httplib::Response& resp){
	LogHttpApiDebug(Display, "%", req.body);
	resp.status = 200;
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
