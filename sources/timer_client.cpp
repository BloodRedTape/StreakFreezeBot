#include "timer_client.hpp"
#include <bsl/format.hpp>
#include <chrono>
#include <thread>

TimerClient::TimerClient(const INIReader& config):
	httplib::Client(
		Format(
			"http://localhost:%",
			config.GetInteger("MiniAppHttpServer", "Port", 2024)
		)
	)
{
	m_Today = DateUtils::Now();

	DateUtils::Debug::PreDateAdvanced = std::bind(&TimerClient::OnDayAlmostOver, this);
}

void TimerClient::Run(){
	for (;;) {
		Tick();
		std::this_thread::sleep_for(std::chrono::milliseconds(100));
		//std::this_thread::sleep_for(std::chrono::minutes(1));
	}
}

void TimerClient::Tick(){
	auto today = DateUtils::Now();

	if (today != m_Today) {
		m_Today = today;
		OnNewDay();
	}

	auto now = std::chrono::system_clock::now();

	auto tt = std::chrono::system_clock::to_time_t(now);
    std::tm localTime = *std::localtime(&tt);

    // Check if it's 2 hours before midnight (22:00 or 10 PM)
    if (localTime.tm_hour == 22 && !m_AlmostOverCalled) {
        OnDayAlmostOver();
    }

    // Check if it's 2 hours before midnight (22:00 or 10 PM)
    if (localTime.tm_hour == 23 && localTime.tm_min >= 40 && !m_MomentBeforeNewDayCalled) {
        OnMomentBeforeNewDay();
    }
}

void TimerClient::OnDayAlmostOver(){
    m_AlmostOverCalled = true;
	Post("/api/timer/day_almost_over");
}

void TimerClient::OnMomentBeforeNewDay(){
    m_MomentBeforeNewDayCalled = true;
	Post("/api/timer/moment_before_new_day");
}

void TimerClient::OnNewDay(){
	m_AlmostOverCalled = false;
	m_MomentBeforeNewDayCalled = false;
	Post("/api/timer/new_day");
}
