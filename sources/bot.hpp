#pragma once

#include <INIReader.h>
#include "simple_bot.hpp"
#include "model.hpp"
#include "logger.hpp"

class StreakBot: public SimplePollBot{
	static constexpr const char *SectionName = "Bot";
	using ThisClass = StreakBot;
private:
	HybridLogger m_Logger;
	Date m_LastDate = DateUtils::Now();
	std::string m_WebAppUrl;
public:
	StreakBot(const INIReader &config);

	void Tick();

	void Start(TgBot::Message::Ptr message);

	void Reset(TgBot::Message::Ptr message);

	static bool IsPrivate(TgBot::Message::Ptr message);

	void OnNewDay();

	void OnDayAlmostOver();

#if WITH_ADVANCE_DATE	
	void AdvanceDate(TgBot::Message::Ptr message);
#endif

#if WITH_DAY_ALMOST_OVER
	void DayAlmostOver(TgBot::Message::Ptr message);
#endif
	void SetupUserUiWith(TgBot::Message::Ptr source, const std::string &text = "");
};