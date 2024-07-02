#include "bot.hpp"
#include <bsl/format.hpp>
#include <thread>

// Streak Freeze limits
// OnDayAlmostOver
// Better UI for streak visualization
// Better way to show available freezes, also add to botfather
// TeamCity

StreakBot::StreakBot(const INIReader& config):
	SimplePollBot(
		config.Get(SectionName, "Token", ""),
		100,
		config.GetInteger(SectionName, "TickPeriodSeconds", 10)
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

void StreakBot::Tick() {
	auto now = DateUtils::Now();

	if (m_LastDate != now) {
		m_LastDate = now;
		OnNewDay();
	}
}

#define ENSURE_PRIVATE_COMMAND(message, db) \
	if(!IsPrivate(message)) \
		return (void)ReplyMessage(message, "This command can only be executed in bot's private chat"); \
	db.EnsureNotificationChat(message->from->id, message->chat->id);

void StreakBot::Start(TgBot::Message::Ptr message) {
	ENSURE_PRIVATE_COMMAND(message, m_DB)

	m_DB.ResetStreak(message->from->id);
	ReplyMessage(message, Format("Started streak"));
}

void StreakBot::AddFreeze(TgBot::Message::Ptr message) {
	ENSURE_PRIVATE_COMMAND(message, m_DB)

	m_DB.AddFreeze(message->from->id, 4);
	ReplyMessage(message, Format("Added streak freeze, % now", m_DB.AvailableFreezes(message->from->id).size()));
}

void StreakBot::UseFreeze(TgBot::Message::Ptr message) {
	ENSURE_PRIVATE_COMMAND(message, m_DB)

	if(m_DB.IsProtectedToday(message->from->id))
		return (void)ReplyMessage(message, "Can't use freeze today, already protected!");

	if(m_DB.IsStreakBurnedOut(message->from->id))
		return (void)ReplyMessage(message, "Streak is already burned out, nothing to freeze.");

	auto freeze = m_DB.UseFreeze(message->from->id);

	if (!freeze.has_value())
		return (void)ReplyMessage(message, "You don't have freezes to use for today");

	ReplyMessage(message, Format("Nice, you left with % freezes and protected your % days streak", m_DB.AvailableFreezes(message->from->id).size(), m_DB.Streak(message->from->id)));
}

void StreakBot::Commit(TgBot::Message::Ptr message) {
	ENSURE_PRIVATE_COMMAND(message, m_DB)

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
	ENSURE_PRIVATE_COMMAND(message, m_DB)

	auto freezes = m_DB.AvailableFreezes(message->from->id);

	if(!freezes.size())
		return (void)ReplyMessage(message, "No freezes available");


	ReplyMessage(message, Format("% freezes available", freezes.size()));
}

void StreakBot::Streak(TgBot::Message::Ptr message) {
	ENSURE_PRIVATE_COMMAND(message, m_DB)

	auto history = m_DB.History(message->from->id);

	std::string text;
	std::string freeze = (const char *)u8"🥶";
	std::string commit = (const char *)u8"🔥";
	std::string nothing = (const char *)u8"❌";
	std::string pending = (const char *)u8"⭕️";

	for (auto day : history) {
		if(day == Protection::Commit)
			text += commit;
		if(day == Protection::Freeze)
			text += freeze;
		if(day == Protection::None)
			text += nothing;
	}

	if (m_DB.IsStreakBurnedOut(message->from->id))
		return (void)ReplyMessage(message, Format("You've lost your % days streak, use /start to reset\n\n%", m_DB.Streak(message->from->id), text));

	if(!m_DB.IsProtectedToday(message->from->id))
		text += pending;

	ReplyMessage(message, Format("Keep going to protect your % days streak\n\n%", m_DB.Streak(message->from->id), text));
}

bool StreakBot::IsPrivate(TgBot::Message::Ptr message) {
	return message->chat->type == TgBot::Chat::Type::Private;
}

void StreakBot::OnNewDay() {
	for (const auto &[user, data] : m_DB.Users()) {
		if(!m_DB.IsProtected(user, Yesterday())){
			auto freeze = m_DB.UseFreeze(user, Yesterday());

			if (freeze.has_value()) {
				SendMessage(data.NotificationChat, 0, Format("Got it! Saved % days streak with a Freeze!", m_DB.Streak(user)));
			} else {
				SendMessage(data.NotificationChat, 0, Format("You've lost your % days streak, we could not protect it as there were no freezes", m_DB.Streak(user)));
			}
		} else {
			for (const auto& freeze : m_DB.AvailableFreezes(user)) {
				if(!freeze.CanBeUsedAt(Tomorrow())){
					SendMessage(data.NotificationChat, 0, Format("Your streak freeze is going to expire tomorrow, better use it today!"));
					break;
				}else if(!freeze.CanBeUsedAt(AfterTomorrow())){
					SendMessage(data.NotificationChat, 0, Format("Tomorrow is the last day to use your streak freeze, don't miss your chance!"));
					break;
				}
			}
		}
		std::this_thread::sleep_for(std::chrono::milliseconds(200));
	}
}

void StreakBot::OnDayAlmostOver() {
	for (const auto &[user, data] : m_DB.Users()) {
		if(!m_DB.IsProtectedToday(user)){
			SendMessage(data.NotificationChat, 0, Format("The day is almost over! commit to your % days streak or use freeze", m_DB.Streak(user)));
			std::this_thread::sleep_for(std::chrono::milliseconds(200));
		}
	}
}

Date StreakBot::Yesterday() {
	return date::sys_days(DateUtils::Now()) - date::days(1);
}

Date StreakBot::Tomorrow() {
	return date::sys_days(DateUtils::Now()) + date::days(1);
}

Date StreakBot::AfterTomorrow() {
	return date::sys_days(DateUtils::Now()) + date::days(2);
}

Date StreakBot::Today() {
	return DateUtils::Now();
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
