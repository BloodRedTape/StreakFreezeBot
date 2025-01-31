#include "streak.hpp"
#include <bsl/log.hpp>
#include <boost/range/algorithm.hpp>

DEFINE_LOG_CATEGORY(Streak)

bool Streak::IsCommitedAt(Date date) const{
	return boost::count(Commits, date);
}

bool Streak::IsFreezedAt(Date date, const std::vector<StreakFreeze> &freezes)const {
	if(!IsFreezable())
		return false;

	for (auto& freeze : freezes) {
		if(freeze.UsedAt.has_value() && freeze.UsedAt.value() == date)
			return true;
	}

	return false;
}

bool Streak::IsProtected(Date start, Date end, const std::vector<StreakFreeze>& freezes)const {
	for (auto date : DateUtils::Range(start, end)) {
		if(!IsProtectedAt(date, freezes))
			return false;
	}

	return true;
}

std::optional<Date> Streak::FirstCommitDate() const{
	return Commits.size() ? std::make_optional(Commits.front()) : std::nullopt;
}

bool Streak::Commit(Date date){
	if (IsCommitedAt(date))
		return (LogStreak(Error, "already commited %", date), false);

	Commits.push_back(date);
	std::sort(Commits.begin(), Commits.end());
	return true;
}

std::int64_t Streak::Count(Date today, const std::vector<StreakFreeze> &freezes) const{
	std::int64_t streak = IsCommitedAt(today);
	
	date::year_month_day check_date = DateUtils::Yesterday(today);

	while (IsProtectedAt(check_date, freezes)) {
		streak += IsCommitedAt(check_date);
		check_date = DateUtils::Yesterday(check_date);
	}

	return streak;
}

std::vector<Protection> Streak::History(Date start, Date end, const std::vector<StreakFreeze> &freezes)const{
	std::vector<Protection> history;

	for (auto date : DateUtils::Range(start, end))
		history.push_back(ProtectionAt(date, freezes));

	return history;
}

std::vector<Protection> Streak::HistoryForToday(Date today, const std::vector<StreakFreeze> &freezes)const{
	auto first = FirstCommitDate();

	if(!first.has_value())
		return {};

	auto start = std::min(first.value(), today);

	return History(start, today, freezes);
}

Protection Streak::ProtectionAt(Date date, const std::vector<StreakFreeze> &freezes)const{
	if(IsCommitedAt(date))
		return Protection::Commit;

	if(IsFreezedAt(date, freezes))
		return Protection::Freeze;

	return Protection::None;
}

StreakPayload::StreakPayload(StreakPayload&& other)noexcept{
	*this = std::move(other);
}

StreakPayload& StreakPayload::operator=(StreakPayload&& other)noexcept{
	this->operator=((const StreakPayload &)StreakPayload());
	std::swap(Id, other.Id);
	std::swap(History, other.History);
	std::swap(Start, other.Start);
	std::swap(Count, other.Count);
	std::swap(Required, other.Required);
	std::swap(Freezable, other.Freezable);
	return *this;
}

std::string ToString(Protection protection){
	switch (protection) {
	case Protection::Commit:
		return "Commit";
	case Protection::Freeze:
		return "Freeze";
	case Protection::NothingToProtect:
		return "NothingToProtect";
	}
	return "None";
}
