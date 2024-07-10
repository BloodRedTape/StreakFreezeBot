#include "server.hpp"
#include "model.hpp"
#include <bsl/log.hpp>

DEFINE_LOG_CATEGORY(HttpApiDebug)

HttpApiServer::HttpApiServer(const INIReader& config, MessageQueue &queue):
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
	m_Queue(queue)
{
	Super::set_mount_point("/", m_WebAppPath);
	
	Get("/user/:id", &ThisClass::GetUser);
	Post("/debug/log", &ThisClass::PostDebugLog);
	Post("/user/:id/commit",	 &ThisClass::Commit);
	Post("/user/:id/add_freeze", &ThisClass::AddFreeze);
	Post("/user/:id/use_freeze", &ThisClass::UseFreeze);
}

void HttpApiServer::Run(){
	Super::listen(m_Hostname, m_Port);
}

void HttpApiServer::GetUser(const httplib::Request& req, httplib::Response& resp){
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());

	StreakDatabase db(m_Config);

	const auto &user = db.GetUser(id);

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

	m_Queue.Post(id, "commit");
}

void HttpApiServer::UseFreeze(const httplib::Request& req, httplib::Response& resp) {
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());

	m_Queue.Post(id, "use_freeze");
}

void HttpApiServer::AddFreeze(const httplib::Request& req, httplib::Response& resp) {
	if (!req.path_params.count("id")) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	const std::string &user_id = req.path_params.at("id");
	std::int64_t id = std::atoll(user_id.c_str());

	m_Queue.Post(id, "add_freeze");
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
