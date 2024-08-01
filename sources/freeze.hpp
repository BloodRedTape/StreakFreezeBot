#pragma once

#include "time.hpp"
#include "json.hpp"

enum class FreezeUsedBy {
    User,
    Auto
};

struct StreakFreeze {
	Date EarnedAt;
	Date ExpireAt;
	std::optional<Date> UsedAt;
	std::optional<FreezeUsedBy> UsedBy;
    bool Removed = false;
    std::string Reason;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE(StreakFreeze, EarnedAt, ExpireAt, UsedAt, UsedBy, Removed, Reason)

	bool CanBeUsedAt(Date date)const;

    void UseAt(Date date, FreezeUsedBy by);
};

inline bool operator<(const StreakFreeze& lhs, const StreakFreeze& rhs) {
	return lhs.ExpireAt < rhs.ExpireAt;
}

