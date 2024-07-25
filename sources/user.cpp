#include "user.hpp"
#include <boost/range/algorithm.hpp>
#include <bsl/log.hpp>

DEFINE_LOG_CATEGORY(User)

bool User::IsCommitedAt(Date date)const {
	return boost::count(Commits, date);
}

bool User::IsFreezedAt(Date date)const {
	for (auto& freeze : Freezes) {
		if(freeze.UsedAt.has_value() && freeze.UsedAt.value() == date)
			return true;
	}

	return false;
}

std::optional<Date> User::FirstCommitDate()const {
	return Commits.size() ? std::make_optional(Commits.front()) : std::nullopt;
}

bool User::Commit(Date date) {
	if(IsProtected(date))
		return (LogUser(Error, "Can't commit on protected %", date), false);

	Commits.push_back(date);
	std::sort(Commits.begin(), Commits.end());
	return true;
}

std::vector<Protection> User::History(Date start, Date end)const{
	std::vector<Protection> history;

	for (auto date : DateUtils::Range(start, end))
		history.push_back(ProtectionAt(date));

	return history;
}

std::vector<Protection> User::HistoryForToday(Date today)const{
	auto start = FirstCommitDate();

	if(!start.has_value())
		return {};

	return History(start.value(), today);
}

Protection User::ProtectionAt(Date date)const{
	if(IsCommitedAt(date))
		return Protection::Commit;

	if(IsFreezedAt(date))
		return Protection::Freeze;

	return Protection::None;
}

void User::AddFreeze(std::int32_t expire_in_days, std::string &&reason, Date today){
	Date expire = (date::sys_days)today + date::days(expire_in_days);

	Freezes.push_back({today, expire, std::nullopt, false, std::move(reason)});
}

void User::RemoveFreeze(std::size_t freeze_id) {
	if(freeze_id >= Freezes.size())
		return;

	Freezes[freeze_id].Removed = true;
}

std::vector<std::size_t> User::AvailableFreezes(Date today) const{
	std::vector<std::size_t> result;

	const auto &freezes = Freezes;

	for (int i = 0; i<freezes.size(); i++) {
		const auto &freeze = freezes[i];

		if(!freeze.CanBeUsedAt(today))
			continue;

		result.push_back(i);
	}

	return result;
}

bool User::CanAddFreeze(Date today)const {
	return AvailableFreezes(today).size() < MaxFreezes;
}

std::int64_t User::Streak(Date today)const {
	std::int64_t streak = IsCommitedAt(today);
	
	date::year_month_day check_date = DateUtils::Yesterday(today);

	while (IsProtected(check_date)) {
		streak += IsCommitedAt(check_date);
		check_date = DateUtils::Yesterday(check_date);
	}

	return streak;
}

std::optional<std::int64_t> User::UseAnyFreeze(Date date) {
	if (IsProtected(date)) {
		LogUser(Error, "Using freeze on a protected day");
		return std::nullopt;
	}

	for (auto i = 0; i < Freezes.size(); i++) {
		auto &freeze = Freezes[i];
		
		//TODO: use best freeze possible
		if (freeze.CanBeUsedAt(date)) {
			freeze.UseAt(date);
			return i;
		}
	}

	return std::nullopt;
}

std::optional<std::int64_t> User::UseFreeze(Date date, std::int64_t freeze_id) {
	if(IsProtected(date)){
		LogUser(Error, "using freeze on an already protected day");
		return std::nullopt;
	}

	if (freeze_id >= Freezes.size()) {
		LogUser(Error, "Invalid FreezeId: %", freeze_id);
		return std::nullopt;
	}
	
	auto &freeze = Freezes[freeze_id];
	
	if (!freeze.CanBeUsedAt(date)) {
		LogUser(Error, "FreezeId % can't be used at %", freeze_id, date);
		return std::nullopt;
	}

	freeze.UseAt(date);

	return freeze_id;
}

std::vector<std::int64_t> User::AutoFreezeExcept(Date today) {
	if(!Commits.size())
		return {};

	Date begin = Commits.front();
	Date end = std::max(Commits.back(), today);

	std::vector<std::int64_t> freezes;

	for (auto date : DateUtils::Range(begin, end)) {
		if(date == today)
			break;

		std::optional<std::int64_t> index = UseAnyFreeze(date);
		
		if(index.has_value())
			freezes.push_back(index.value());
	}

	return freezes;
}

void User::AddFriend(std::int64_t id) {
	if(HasFriend(id))
		return LogUser(Error, "Friend is already added");

	Friends.push_back(id);
}

void User::RemoveFriend(std::int64_t id) {
	auto it = boost::find(Friends, id);

	if(it == Friends.end())
		return LogUser(Error, "Removing non-existing friend");
		
	std::swap(Friends.back(), *it);
	Friends.pop_back();
}

bool User::HasFriend(std::int64_t id)const {
	return boost::count(Friends, id);
}
