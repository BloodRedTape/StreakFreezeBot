#pragma once

#include <INIReader.h>
#include "simple_bot.hpp"
#include "model.hpp"
#include "logger.hpp"

class StreakBot: public SimplePollBot{
	static constexpr const char *SectionName = "Bot";
	using ThisClass = StreakBot;
private:
	TelegramLogger m_Logger;
	Date m_LastDate = DateUtils::Now();
	std::string m_WebAppUrl;
public:
	StreakBot(const INIReader &config);

	void Tick();

	void Start(TgBot::Message::Ptr message);

	void Reset(TgBot::Message::Ptr message);

	void AddFreeze(TgBot::Message::Ptr message);

	void UseFreeze(TgBot::Message::Ptr message);

	void Commit(TgBot::Message::Ptr message);

	void Freezes(TgBot::Message::Ptr message);

	void Streak(TgBot::Message::Ptr message);

	static bool IsPrivate(TgBot::Message::Ptr message);

	void OnNewDay();

	void OnDayAlmostOver();

	Date Yesterday();

	Date Tomorrow();

	Date AfterTomorrow();

	Date Today();

#if WITH_ADVANCE_DATE	
	void AdvanceDate(TgBot::Message::Ptr message);
#endif

#if WITH_DAY_ALMOST_OVER
	void DayAlmostOver(TgBot::Message::Ptr message);
#endif
	void SetupUserUiWith(TgBot::Message::Ptr source, const std::string &text = "");
};