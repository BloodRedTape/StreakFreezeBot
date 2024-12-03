#include "bot.hpp"
#include <bsl/format.hpp>
#include <thread>
#include <atomic>
#include "http.hpp"
#include "notification.hpp"
#include <boost/algorithm/string.hpp>

#undef SendMessage

DEFINE_LOG_CATEGORY(Bot)

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
		config.Get(SectionName, "Token", ""),
		100,
		1
	),
	m_Logger(config),
	m_WebAppUrl(
		config.Get(SectionName, "WebAppUrl", "")
	),
	m_WebApiUrl(
		Format(
			"http://localhost:%",
			config.GetInteger("MiniAppHttpServer", "Port", 2024)
		)
	)
{
	s_Bot = this;

	OnCommand("start", this, &ThisClass::Start, "start");
	OnCommand("invalidate_quote", this, &ThisClass::InvalidateQuote);
	OnCommand("push_quote", this, &ThisClass::PushQuote);
#if WITH_ADVANCE_DATE
	OnCommand("advance_date", this, &ThisClass::AdvanceDate, "Debug - Advance current date");
#endif

#if WITH_TIMER_TRIGGER
	OnCommand("new_day",this,&StreakBot::OnNewDay);
	OnCommand("day_almost_over", this, &StreakBot::OnDayAlmostOver);
	OnCommand("moment_before_new_day", this, &StreakBot::OnMomentBeforeNewDay);
#endif

	UpdateCommandDescriptions();
	
	OnLog(&m_Logger, &Logger::Log);
}

void StreakBot::Tick() {
	constexpr int NotsPerTick = 4;

	for (int i = 0; i < NotsPerTick && m_Notifications.size(); i++) {
		const auto &notification = m_Notifications.front();
		SendMessage(notification.UserId, 0, notification.Message);
		m_Notifications.pop();
	}


	httplib::Client client(m_WebApiUrl);

	auto resp = client.Get("/api/notifications", {{"BotToken", getToken()}});

	if(!resp)
		return LogBot(Error, "Can't get notifications from %, because of internal error %", client.host(), httplib::to_string(resp.error()));
	
	try {
		std::vector<Notification> notifications = nlohmann::json::parse(resp->body);

		for (const auto& notification : notifications) {
			m_Notifications.push(notification);
		}
	} catch (const std::exception& e) {
		LogBot(Error, "Can't parse notifications %", e.what());
	}
}

void StreakBot::Start(TgBot::Message::Ptr message) {
	SetupUserUiWith(message, "Hi there!");
}

auto Admin = "BloodRedTape";

void StreakBot::InvalidateQuote(TgBot::Message::Ptr message) {
	if(message->from->username != Admin)
		return;

	HttpPost(m_WebApiUrl, "/api/quote/invalidate", {{"BotToken", getToken()}});
}

void StreakBot::PushQuote(TgBot::Message::Ptr message) {
	if(message->from->username != Admin)
		return;

	std::string quote;

	auto space = message->text.find_first_of(' ');

	if(space == std::string::npos)
		return;

	quote = message->text.substr(space + 1);

	HttpPost(m_WebApiUrl, "/api/quote/push", {{"BotToken", getToken()}}, quote);
}

bool StreakBot::IsPrivate(TgBot::Message::Ptr message) {
	return message->chat->type == TgBot::Chat::Type::Private;
}

#if WITH_ADVANCE_DATE
void StreakBot::AdvanceDate(TgBot::Message::Ptr message) {
	DateUtils::Debug::AdvanceCurrentDate();

	ReplyMessage(message, Format("Advanced date by 1 day: %", DateUtils::Now()));
}
#endif

#if WITH_TIMER_TRIGGER
void StreakBot::OnNewDay(TgBot::Message::Ptr message){
	HttpPost(m_WebApiUrl, "/api/timer/new_day");
}
void StreakBot::OnDayAlmostOver(TgBot::Message::Ptr message){
	HttpPost(m_WebApiUrl, "/api/timer/day_almost_over");
}
void StreakBot::OnMomentBeforeNewDay(TgBot::Message::Ptr message){
	HttpPost(m_WebApiUrl, "/api/timer/moment_before_new_day");
}
#endif

void StreakBot::SetupUserUiWith(TgBot::Message::Ptr source, const std::string& text) {
	auto web_app = std::make_shared<TgBot::WebAppInfo>();
	web_app->url = m_WebAppUrl;

	try{
		auto menu_button = std::make_shared<TgBot::MenuButtonWebApp>();
		menu_button->text = "Streak";
		menu_button->webApp = web_app;

		getApi().setChatMenuButton(source->chat->id, menu_button);
	}catch (const std::exception& e) {
		Log("Failed to set chat menu: %", e.what());
	}
}
