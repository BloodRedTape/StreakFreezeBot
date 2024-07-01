#pragma once

#include <INIReader.h>
#include "simple_bot.hpp"
#include "model.hpp"

class StreakBot: public SimpleBot{
	static constexpr const char *SectionName = "Bot";
	using ThisClass = StreakBot;
private:
	StreakDatabase m_DB;
public:
	StreakBot(const INIReader &config);

	void Start(TgBot::Message::Ptr message);

	void AddFreeze(TgBot::Message::Ptr message);

	void UseFreeze(TgBot::Message::Ptr message);

	void Commit(TgBot::Message::Ptr message);

	void Freezes(TgBot::Message::Ptr message);

	void Streak(TgBot::Message::Ptr message);

	void OnNewDay();
#if WITH_ADVANCE_DATE	
	void AdvanceDate(TgBot::Message::Ptr message);
#endif
};