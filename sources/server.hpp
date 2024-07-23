#pragma once

#include <httplib.h>
#include <INIReader.h>
#include <chrono>
#include "model.hpp"

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
	StreakDatabase m_DB;

	std::string m_QuoteApiKey;
	int m_QuoteUpdateMinutes = 60;
	std::chrono::steady_clock::time_point m_LastUpdate;
	std::string m_LastQuote;
public:	
	HttpApiServer(const INIReader &config);

	void Run();

	void GetFullUser(const httplib::Request &req, httplib::Response &resp);

	void Commit(const httplib::Request &req, httplib::Response &resp);

	void UseFreeze(const httplib::Request &req, httplib::Response &resp);

	void AddFreeze(const httplib::Request &req, httplib::Response &resp);

	void RemoveFreeze(const httplib::Request &req, httplib::Response &resp);

	void GetAvailableFreezes(const httplib::Request &req, httplib::Response &resp);

	void ResetStreak(const httplib::Request &req, httplib::Response &resp);

	void PostDebugLog(const httplib::Request &req, httplib::Response &resp);

	void GetQuote(const httplib::Request &req, httplib::Response &resp);

	void AcceptFriendInvite(const httplib::Request &req, httplib::Response &resp);

	void RemoveFriend(const httplib::Request &req, httplib::Response &resp);

	void GetFriends(const httplib::Request &req, httplib::Response &resp);

	std::optional<std::int64_t> GetUser(const httplib::Request &req)const;

	std::optional<std::int64_t> GetIdParam(const httplib::Request &req, const std::string &name)const;

	HttpApiServer &Get(const std::string &pattern, HttpApiHandler handler);

	HttpApiServer &Post(const std::string &pattern, HttpApiHandler handler);
};