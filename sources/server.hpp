#pragma once

#include <httplib.h>
#include <INIReader.h>
#include "queue.hpp"

class HttpApiServer : public httplib::Server {
	using Super = httplib::Server;
	using ThisClass = HttpApiServer;
public:
	static constexpr const char *SectionName = "MiniAppHttpServer";

	using HttpApiHandler = void (HttpApiServer::*)(const httplib::Request &, httplib::Response &);
private:
	INIReader m_Config;
	std::string m_WebAppPath;
	std::string m_Hostname;
	int m_Port;
	MessageQueue &m_Queue;
public:	
	HttpApiServer(const INIReader &config, MessageQueue &queue);

	void Run();

	void GetUser(const httplib::Request &req, httplib::Response &resp);

	void Commit(const httplib::Request &req, httplib::Response &resp);

	void UseFreeze(const httplib::Request &req, httplib::Response &resp);

	void AddFreeze(const httplib::Request &req, httplib::Response &resp);
	
	void PostDebugLog(const httplib::Request &req, httplib::Response &resp);

	HttpApiServer &Get(const std::string &pattern, HttpApiHandler handler);

	HttpApiServer &Post(const std::string &pattern, HttpApiHandler handler);
};