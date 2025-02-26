#pragma once

#include "http.hpp"
#include <INIReader.h>
#include <chrono>
#include <queue>
#include "model.hpp"
#include <tgbot/Bot.h>
#include "logger.hpp"
#include "notification.hpp"

class HttpApiServer : public HttpServer {
	using Super = HttpServer;
	using ThisClass = HttpApiServer;
public:
	static constexpr const char *SectionName = "MiniAppHttpServer";
private:
	INIReader m_Config;
	std::string m_WebAppPath;
	std::string m_Hostname;
	int m_Port;
	bool m_RegenerateExtendedCache = true;
	StreakDatabase m_DB;

	std::string m_OpenAIKey;
	int m_QuoteUpdateMinutes = 60;
	std::chrono::steady_clock::time_point m_LastUpdate;
	std::queue<std::string> m_Quotes;
	
	HybridLogger m_Logger;
	std::string m_BotToken;
	TgBot::Bot m_Bot;

	std::vector<Notification> m_Notifications;

	std::unordered_map<std::string, std::string> m_ExtendedCache;

	struct CachedChatInfo {
		static constexpr int UpdateIntervalMinutes = 30;
		std::chrono::steady_clock::time_point LastUpdate;

		std::string Username;
		std::string FirstName;
		std::string LastName;
		bool IsUnknown = false;
	};

	std::unordered_map<std::int64_t, CachedChatInfo> m_ChatInfoCache;
public:	
	HttpApiServer(const INIReader &config);

	void Run();

	void GetFullUser(const httplib::Request &req, httplib::Response &resp);

	void GetMinimalUser(const httplib::Request &req, httplib::Response &resp);

	void Commit(const httplib::Request &req, httplib::Response &resp);

	void AddStreak(const httplib::Request &req, httplib::Response &resp);

	void RemoveStreak(const httplib::Request &req, httplib::Response &resp);

	void SetStreakVisible(const httplib::Request &req, httplib::Response &resp);

	void PostPendingSubmition(const httplib::Request &req, httplib::Response &resp);

	void GetPendingSubmition(const httplib::Request &req, httplib::Response &resp);

	void UseFreeze(const httplib::Request &req, httplib::Response &resp);

	void AddFreeze(const httplib::Request &req, httplib::Response &resp);

	void RemoveFreeze(const httplib::Request &req, httplib::Response &resp);

	void PostDebugLog(const httplib::Request &req, httplib::Response &resp);

	void PostPushQuote(const httplib::Request &req, httplib::Response &resp);

	void PostInvalidateQuote(const httplib::Request &req, httplib::Response &resp);

	bool IsAuthByBot(const httplib::Request &req)const;

	void GetQuote(const httplib::Request &req, httplib::Response &resp);

	void AcceptFriendInvite(const httplib::Request &req, httplib::Response &resp);

	void RemoveFriend(const httplib::Request &req, httplib::Response &resp);

	void GetFriends(const httplib::Request &req, httplib::Response &resp);

	void GetToken(const httplib::Request &req, httplib::Response &resp);

	void NewChallenge(const httplib::Request &req, httplib::Response &resp);

	void JoinChallenge(const httplib::Request &req, httplib::Response &resp);

	void LeaveChallenge(const httplib::Request &req, httplib::Response &resp);

	void GetChallengeParticipants(const httplib::Request &req, httplib::Response &resp);

	void GetChallengeInviteParticipantsPreview(const httplib::Request &req, httplib::Response &resp);

	void GetChallengeInvitePreview(const httplib::Request &req, httplib::Response &resp);

	const std::string &GetOrGenerateExtended(const std::vector<std::string> &descrs);

	const CachedChatInfo &GetOrFetchChatInfo(std::int64_t user);

	void RegenerateExtendedCache();

	void OnDayAlmostOver(const httplib::Request &req, httplib::Response &resp);

	void OnMomentBeforeNewDay(const httplib::Request &req, httplib::Response &resp);

	void OnNewDay(const httplib::Request &req, httplib::Response &resp);

	void GetNotifications(const httplib::Request &req, httplib::Response &resp);

	void NudgeFriend(const httplib::Request &req, httplib::Response &resp);

	std::optional<std::int64_t> GetUser(const httplib::Request &req)const;

	bool IsAuthForUserByToken(const httplib::Request &req, std::int64_t user)const;

	bool IsAuthForUserTgHash(const httplib::Request &req, std::int64_t user)const;

	bool IsAuthForUser(const httplib::Request &req, std::int64_t user)const;
};