#include "bot.hpp"
#include <bsl/format.hpp>
#include <thread>
#include "http.hpp"
#include <boost/algorithm/string.hpp>

#undef SendMessage

// Streak Freeze limits
// OnDayAlmostOver
// Better UI for streak visualization
// Better way to show available freezes, also add to botfather
// TeamCity

const char *Ok = "Ok";
const char *Fail = "Fail";

StreakBot::StreakBot(const INIReader& config):
	SimplePollBot(
		config.Get(SectionName, "Token", "")
	),
	m_TgLog(config),
	m_Console(),
	m_Logger({&m_TgLog, &m_Console}),
	m_WebAppUrl(
		config.Get(SectionName, "WebAppUrl", "")
	)
{
	OnCommand("start", this, &ThisClass::Start, "start");
	OnCommand("reset", this, &ThisClass::Reset, "Reset streak");
	OnCommand("add_freeze", this, &ThisClass::AddFreeze, "Add freeze to freezes storage");
	OnCommand("use_freeze", this, &ThisClass::UseFreeze, "Use one freeze from storage");
	OnCommand("freezes", this, &ThisClass::Freezes, "List available freezes");
	OnCommand("commit", this, &ThisClass::Commit, "Commit to protect streak");
	OnCommand("streak", this, &ThisClass::Streak, "Show streak progress");
#if WITH_ADVANCE_DATE
	OnCommand("advance_date", this, &ThisClass::AdvanceDate, "Debug - Advance current date");
#endif
#if WITH_DAY_ALMOST_OVER
	OnCommand("day_almost_over", this, &ThisClass::DayAlmostOver, "Debug - Trigger DayAlmostOver");
#endif

	UpdateCommandDescriptions();
	
	OnLog(&m_Logger, &Logger::Log);
}

void StreakBot::Tick() {
	auto now = DateUtils::Now();

	if (m_LastDate != now) {
		m_LastDate = now;
		OnNewDay();
	}
}

void StreakBot::Start(TgBot::Message::Ptr message) {
	SetupUserUiWith(message, "Hi there!");
}

void StreakBot::Reset(TgBot::Message::Ptr message) {
	HttpPost(m_WebAppUrl, Format("/user/%/reset_streak", message->from->id));

	SetupUserUiWith(message, "Streak history is reset now");
}

void StreakBot::AddFreeze(TgBot::Message::Ptr message) {
	auto body = HttpPostJson(m_WebAppUrl, Format("/user/%/add_freeze", message->from->id));

	if(body.count(Fail))
		return (void)ReplyMessage(message, body[Fail]);

	if(body.count(Ok))
		return (void)ReplyMessage(message, body[Ok]);
}

void StreakBot::UseFreeze(TgBot::Message::Ptr message) {
	nlohmann::json body = HttpPostJson(m_WebAppUrl, Format("/user/%/use_freeze", message->from->id));
	
	if(body.count(Fail))
		return (void)ReplyMessage(message, body[Fail]);

	if(body.count(Ok))
		return (void)ReplyMessage(message, body[Ok]);
}

void StreakBot::Commit(TgBot::Message::Ptr message) {
	nlohmann::json body = HttpPostJson(m_WebAppUrl, Format("/user/%/commit", message->from->id));
	
	if(body.count(Fail))
		return (void)ReplyMessage(message, body[Fail]);

	if(body.count(Ok))
		return (void)ReplyMessage(message, body[Ok]);
}

void StreakBot::Freezes(TgBot::Message::Ptr message) {
	nlohmann::json body = HttpGetJson(m_WebAppUrl, Format("/user/%/commit", message->from->id));
	
	auto freezes = body.size();

	if(!freezes)
		return (void)ReplyMessage(message, "No freezes available");


	ReplyMessage(message, Format("% freezes available", freezes));
}

void StreakBot::Streak(TgBot::Message::Ptr message) {
#if 0
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
#endif
}

bool StreakBot::IsPrivate(TgBot::Message::Ptr message) {
	return message->chat->type == TgBot::Chat::Type::Private;
}

void StreakBot::OnNewDay() {
#if 0
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
#endif
}

void StreakBot::OnDayAlmostOver() {
#if 0
	for (const auto &[user, data] : m_DB.Users()) {
		if(!m_DB.IsProtectedToday(user)){
			SendMessage(data.NotificationChat, 0, Format("The day is almost over! commit to your % days streak or use freeze", m_DB.Streak(user)));
			std::this_thread::sleep_for(std::chrono::milliseconds(200));
		}
	}
#endif
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
void StreakBot::AdvanceDate(TgBot::Message::Ptr message) {
	DateUtils::Debug::AdvanceCurrentDate();

	ReplyMessage(message, Format("Advanced date by 1 day: %", DateUtils::Now()));
}
#endif

#if WITH_DAY_ALMOST_OVER
void StreakBot::DayAlmostOver(TgBot::Message::Ptr message) {
	OnDayAlmostOver();
}
#endif

void StreakBot::SetupUserUiWith(TgBot::Message::Ptr source, const std::string& text) {
	auto web_app = std::make_shared<TgBot::WebAppInfo>();
	web_app->url = m_WebAppUrl;

	{
		auto menu_button = std::make_shared<TgBot::MenuButtonWebApp>();
		menu_button->text = "Streak";
		menu_button->webApp = web_app;

		getApi().setChatMenuButton(source->chat->id, menu_button);
	}
#if 0
	{
		auto streak_button = std::make_shared<TgBot::KeyboardButton>();
		streak_button->text = "Streak";
		streak_button->webApp = web_app;

		auto commit_button = std::make_shared<TgBot::KeyboardButton>();
		commit_button->text = "/commit";

		auto markup = std::make_shared<TgBot::ReplyKeyboardMarkup>();
		markup->isPersistent = true;
		markup->keyboard = {
			{streak_button}, 
			{commit_button}
		};

		if(!text.size())
			SendMessage(source->chat->id, source->isTopicMessage ? source->messageThreadId : 0, text, markup);
		else
			SendMessage(source->chat->id, source->isTopicMessage ? source->messageThreadId : 0, text, markup, source->messageId);
	}
#endif
}
