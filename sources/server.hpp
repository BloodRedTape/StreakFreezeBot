#pragma once

#include <httplib.h>
#include <INIReader.h>
#include <chrono>
#include <queue>
#include "model.hpp"
#include <tgbot/Bot.h>
#include "logger.hpp"
#include "notification.hpp"

class HttpApiServer : public httplib::Server {
	using Super = httplib::Server;
	using ThisClass = HttpApiServer;
public:
	static constexpr const char *SectionName = "MiniAppHttpServer";

	using HttpApiHandler = void (HttpApiServer::*)(const httplib::Request &, httplib::Response &);
private:
	INIReader m_Config;
	std::string m_WebAppPath;
	std::string m_WebAppConfigPath;
	std::string m_Hostname;
	int m_Port;
	StreakDatabase m_DB;

	std::string m_OpenAIKey;
	int m_QuoteUpdateMinutes = 60;
	std::chrono::steady_clock::time_point m_LastUpdate;
	std::queue<std::string> m_Quotes;
	
	HybridLogger m_Logger;
	std::string m_BotToken;
	TgBot::Bot m_Bot;

	std::vector<Notification> m_Notifications;

	std::unordered_map<std::string, std::string> m_TelegramCache;
	std::unordered_map<std::string, std::string> m_PlaceholdersCache;
	std::unordered_map<std::string, std::string> m_ExtendedCache;
public:	
	HttpApiServer(const INIReader &config);

	void Run();

	void GetFullUser(const httplib::Request &req, httplib::Response &resp);

	void Commit(const httplib::Request &req, httplib::Response &resp);

	void AddStreak(const httplib::Request &req, httplib::Response &resp);

	void RemoveStreak(const httplib::Request &req, httplib::Response &resp);

	void PostPendingSubmition(const httplib::Request &req, httplib::Response &resp);

	void GetPendingSubmition(const httplib::Request &req, httplib::Response &resp);

	void UseFreeze(const httplib::Request &req, httplib::Response &resp);

	void AddFreeze(const httplib::Request &req, httplib::Response &resp);

	void RemoveFreeze(const httplib::Request &req, httplib::Response &resp);

	void GetAvailableFreezes(const httplib::Request &req, httplib::Response &resp);

	void PostDebugLog(const httplib::Request &req, httplib::Response &resp);

	void PostPushQuote(const httplib::Request &req, httplib::Response &resp);

	void PostInvalidateQuote(const httplib::Request &req, httplib::Response &resp);

	bool IsAuthByBot(const httplib::Request &req)const;

	void GetQuote(const httplib::Request &req, httplib::Response &resp);

	void AcceptFriendInvite(const httplib::Request &req, httplib::Response &resp);

	void RemoveFriend(const httplib::Request &req, httplib::Response &resp);

	void GetFriends(const httplib::Request &req, httplib::Response &resp);

	void GetTg(const httplib::Request &req, httplib::Response &resp);

	const std::string &GetOrDownloadTgFile(const std::string &path);

	const std::string &GetOrDownloadPlaceholder(const std::string &first_name, const std::string &last_name);

	const std::string &GetOrGenerateExtended(const std::vector<std::string> &descrs);

	void RegenerateExtendedCache();

	void OnDayAlmostOver(const httplib::Request &req, httplib::Response &resp);

	void OnNewDay(const httplib::Request &req, httplib::Response &resp);

	void GetNotifications(const httplib::Request &req, httplib::Response &resp);

	void NudgeFriend(const httplib::Request &req, httplib::Response &resp);

	std::optional<std::int64_t> GetUser(const httplib::Request &req)const;

	std::optional<std::int64_t> GetIdParam(const httplib::Request &req, const std::string &name)const;

	std::optional<std::string> GetParam(const httplib::Request &req, const std::string &name)const;

	bool IsAuthForUser(const httplib::Request &req, std::int64_t user)const;

	HttpApiServer &Get(const std::string &pattern, HttpApiHandler handler);

	HttpApiServer &Post(const std::string &pattern, HttpApiHandler handler);
};