#include "freeze.hpp"
#include <cassert>

bool StreakFreeze::CanBeUsedAt(Date date) const{
	bool can = ExpireAt > date && date >= EarnedAt;

	return can && !Removed && !UsedAt.has_value();
}

void StreakFreeze::UseAt(Date date, FreezeUsedBy by) {
	assert(CanBeUsedAt(date));

	UsedAt = std::make_optional(date);
	UsedBy = std::make_optional(by);
}
