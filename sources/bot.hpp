#pragma once

#include <INIReader.h>
#include <queue>
#include <chrono>
#include "simple_bot.hpp"
#include "model.hpp"
#include "logger.hpp"
#include "notification.hpp"

class StreakBot: public SimplePollBot{
	static constexpr const char *SectionName = "Bot";
	using ThisClass = StreakBot;
private:
	HybridLogger m_Logger;
	Date m_LastDate = DateUtils::Now();
	std::string m_WebAppUrl;

	std::string m_WebApiUrl;

	std::queue<Notification> m_Notifications;
public:
	StreakBot(const INIReader &config);

	void Tick();

	void Start(TgBot::Message::Ptr message);

	void Reset(TgBot::Message::Ptr message);

	static bool IsPrivate(TgBot::Message::Ptr message);

#if WITH_ADVANCE_DATE	
	void AdvanceDate(TgBot::Message::Ptr message);
#endif

	void SetupUserUiWith(TgBot::Message::Ptr source, const std::string &text = "");
};