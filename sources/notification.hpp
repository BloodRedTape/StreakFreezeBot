#pragma once

#include "time.hpp"
#include "json.hpp"

struct Notification {
	std::int64_t UserId = 0;
	std::string Message;
	Date EmitionTime;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE(Notification, UserId, Message, EmitionTime)
};