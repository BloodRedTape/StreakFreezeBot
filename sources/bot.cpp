#include "bot.hpp"
#include <bsl/format.hpp>

StreakBot::StreakBot(const INIReader& config):
	SimpleBot(
		config.Get(SectionName, "Token", "")
	),
	m_DB(config)
{
	OnCommand("start", this, &ThisClass::Start);
	OnCommand("add_freeze", this, &ThisClass::AddFreeze);
	OnCommand("use_freeze", this, &ThisClass::UseFreeze);
	OnCommand("freezes", this, &ThisClass::Freezes);
	OnCommand("commit", this, &ThisClass::Commit);
	OnCommand("streak", this, &ThisClass::Streak);
#if WITH_ADVANCE_DATE
	OnCommand("advance_date", this, &ThisClass::AdvanceDate);
#endif
}


void StreakBot::Start(TgBot::Message::Ptr message) {
	m_DB.ResetStreak(message->from->id);
	ReplyMessage(message, Format("Started streak"));
}

void StreakBot::AddFreeze(TgBot::Message::Ptr message) {
	m_DB.AddFreeze(message->from->id, 4);
	ReplyMessage(message, Format("Added streak freeze, % now", m_DB.AvailableFreezes(message->from->id).size()));
}

void StreakBot::UseFreeze(TgBot::Message::Ptr message) {

	if(m_DB.IsCommitedToday(message->from->id))
		return (void)ReplyMessage(message, "Can't use freeze, already commited today!");

	auto freeze = m_DB.UseFreeze(message->from->id);

	if (!freeze.has_value())
		return (void)ReplyMessage(message, "You don't have freezes to use for today");

	ReplyMessage(message, Format("Nice, you left with % freezes and protected your % days streak", m_DB.AvailableFreezes(message->from->id).size(), m_DB.Streak(message->from->id)));
}

void StreakBot::Commit(TgBot::Message::Ptr message) {
	auto user = message->from->id;

	if(m_DB.IsCommitedToday(user))
		return (void)ReplyMessage(message, "Already commited today, don't overtime!");

	if(m_DB.IsFreezedToday(user))
		return (void)ReplyMessage(message, "Freeze is already used!");

	if(m_DB.IsStreakBurnedOut(user)){
		m_DB.ResetStreak(user);
		return (void)ReplyMessage(message, "Streak is burned out, reset");
	}

	if(!m_DB.Commit(user))
		return (void)ReplyMessage(message, "Something wrong, contact @bloodredtape for bug report");

	ReplyMessage(message, Format("Whoa, extended streak to % days", m_DB.Streak(user)));
}

void StreakBot::Freezes(TgBot::Message::Ptr message) {
	auto freezes = m_DB.AvailableFreezes(message->from->id);

	if(!freezes.size())
		return (void)ReplyMessage(message, "No freezes available");


	ReplyMessage(message, Format("% freezes available", freezes.size()));
}

void StreakBot::Streak(TgBot::Message::Ptr message) {
	auto history = m_DB.GatherHistory(message->from->id);

	std::string text = Format("Your streak is % days: \n", m_DB.Streak(message->from->id));

	std::string freeze = (const char *)u8"🥶";
	std::string commit = (const char *)u8"🔥";
	std::string nothing = (const char *)u8"💀";

	for (auto day : history) {
		if(day.second == Protection::Commit)
			text += commit;
		if(day.second == Protection::Freeze)
			text += freeze;
		if(day.second == Protection::None)
			text += nothing;
	}

	ReplyMessage(message, text);
}

void StreakBot::OnNewDay() {

}
#if WITH_ADVANCE_DATE
namespace DateUtils{
extern Date s_Now;
}

void StreakBot::AdvanceDate(TgBot::Message::Ptr message) {
	DateUtils::s_Now = (date::sys_days)DateUtils::s_Now + date::days(1);

	ReplyMessage(message, Format("Advanced date by 1 day: %", DateUtils::Now()));
}
#endif
