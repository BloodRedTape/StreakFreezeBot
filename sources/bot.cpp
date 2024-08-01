#include "bot.hpp"
#include <bsl/format.hpp>
#include <thread>
#include <atomic>
#include "http.hpp"
#include <boost/algorithm/string.hpp>

#undef SendMessage

static std::atomic<StreakBot*> s_Bot = nullptr;

void LogFunctionExternal(const std::string& category, Verbosity verbosity, const std::string& message) {
	if(!s_Bot || verbosity < Error)
		return;

	static std::mutex s_LogLock;
	std::scoped_lock lock(s_LogLock);
	s_Bot.load()->Log("[%][%] %", category, verbosity, message);
}

StreakBot::StreakBot(const INIReader& config):
	SimplePollBot(
		config.Get(SectionName, "Token", "")
	),
	m_Logger(config),
	m_WebAppUrl(
		config.Get(SectionName, "WebAppUrl", "")
	)
{
	s_Bot = this;

	OnCommand("start", this, &ThisClass::Start, "start");
	OnCommand("reset", this, &ThisClass::Reset, "Reset user data");
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
}
