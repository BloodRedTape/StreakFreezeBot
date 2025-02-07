#pragma once

#include "json.hpp"


struct NotificationsPreferences {
	bool DayAlmostOver = true;
	bool CanNotWait = true;

	bool StreakLost = true;
	bool ChallengeLost = true;

	bool Commited = false;
	bool Freezed = false;
	
	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(NotificationsPreferences, DayAlmostOver, CanNotWait, StreakLost, ChallengeLost, Commited, Freezed)
};

struct UserPreferences {
	NotificationsPreferences Notifications;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(UserPreferences, Notifications)
};