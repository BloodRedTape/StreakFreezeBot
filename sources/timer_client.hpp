#pragma once

#include <INIReader.h>
#include "http.hpp"
#include "time.hpp"

class TimerClient: public httplib::Client{
	Date m_Today;
	bool m_AlmostOverCalled = false;
	bool m_MomentBeforeNewDayCalled = false;
public:
	TimerClient(const INIReader &config);

	void Run();

	void Tick();
	
	void OnDayAlmostOver();

	void OnMomentBeforeNewDay();

	void OnNewDay();
};