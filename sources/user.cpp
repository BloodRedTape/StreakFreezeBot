#include "user.hpp"
#include <boost/range/algorithm.hpp>
#include <boost/range/adaptor/reversed.hpp>
#include <bsl/log.hpp>

DEFINE_LOG_CATEGORY(User)

User::User(std::vector<StreakFreeze> &&freezes, std::int64_t max_freezes, std::vector<std::int64_t> &&friends, std::vector<Streak> &&streaks):
	Freezes(std::move(freezes)),
	MaxFreezes(max_freezes),
	Friends(friends),
	Streaks(streaks)
{}

bool User::AddStreak(const std::string& descr) {
	if(HasStreak(descr))
		return (LogUser(Error, "Streak '%' is already created", descr), false);
	
	Streaks.push_back(Streak(descr));

	return true;
}

bool User::HasStreak(const std::string& descr)const {
	auto IsSameDescription = [&](const Streak& streak) {
		return streak.Description == descr && streak.Status != StreakStatus::Removed;
	};

	return boost::count_if(Streaks, IsSameDescription);
}

Streak* User::GetStreak(std::int64_t id){
	if(id >= Streaks.size())
		return nullptr;

	return &Streaks[id];
}

Streak* User::GetStreak(const std::string& descr) {
	auto IsSameDescription = [&](const Streak& streak) {
		return streak.Description == descr;
	};

	auto it = boost::find_if(Streaks, IsSameDescription);

	if(it == Streaks.end())
		return nullptr;

	return &*it;
}

std::vector<std::int64_t> &User::SubmitionFor(Date today) const {
	if (TodaySubmition.At != today) {
		TodaySubmition.At = today;
		TodaySubmition.Ids = {};
	}

	return TodaySubmition.Ids;
}
std::vector<std::int64_t> User::ActiveStreaks(Date today)const {
	std::vector<std::int64_t> streaks;
	for (auto i = 0; i < Streaks.size(); i++) {
		if(Streaks[i].Count(today, Freezes))
			streaks.push_back(i);
	}
	return streaks;
}

std::vector<std::int64_t> User::ActivePendingStreaks(Date today)const {
	std::vector<std::int64_t> streaks;
	for (auto i = 0; i < Streaks.size(); i++) {
		if(Streaks[i].Count(today, Freezes) && !Streaks[i].IsProtectedAt(today, Freezes))
			streaks.push_back(i);
	}
	return streaks;
}

std::vector<std::int64_t> User::UnactiveStreaks(Date today)const {
	auto active = ActiveStreaks(today);

	std::vector<std::int64_t> streaks;

	for (auto i = 0; i < Streaks.size(); i++) {
		if(!boost::count(active, i))
			streaks.push_back(i);
	}

	return streaks;
}

std::int64_t User::ActiveCount(Date today)const {
	std::int64_t streak = AreActiveCommited(today);
	
	date::year_month_day check_date = DateUtils::Yesterday(today);

	while (AreActiveProtected(check_date)) {
		streak += AreActiveCommited(check_date);
		check_date = DateUtils::Yesterday(check_date);
	}

	return streak;
}

std::vector<Protection> User::ActiveHistory(Date start, Date end)const {
	std::vector<Protection> history;

	for (auto date : DateUtils::Range(start, end))
		history.push_back(ActiveProtection(date));

	return history;
}

std::vector<Protection> User::ActiveHistoryForToday(Date today)const {
	auto start = FirstCommitEver();

	if(!start.has_value())
		return {};

	return ActiveHistory(start.value(), today);
}

bool User::IsFreezedAt(Date date)const {
	for (auto& freeze : Freezes) {
		if(freeze.UsedAt.has_value() && freeze.UsedAt.value() == date)
			return true;
	}

	return false;
}

bool User::IsFreezedByAt(Date date, FreezeUsedBy by)const {
	for (auto& freeze : Freezes) {
		if(freeze.UsedAt.has_value() 
		&& freeze.UsedAt.value() == date
		&& freeze.UsedBy.has_value()
		&& freeze.UsedBy.value() == by)
			return true;
	}

	return false;
}

bool User::AreActiveCommited(Date date)const {
	if (!ActiveStreaks(date).size())
		return false;

	for (auto id : ActiveStreaks(date)) {
		if (id >= Streaks.size()) {
			LogUser(Error, "Invalid streak id %", id);
			continue;
		}

		if (!Streaks[id].IsCommitedAt(date))
			return false;
	}

	return true;
}

bool User::AreActiveProtected(Date date)const {
	return AreActiveCommited(date) || IsFreezedAt(date);
}

Protection User::ActiveProtection(Date date)const {
	if(AreActiveCommited(date))
		return Protection::Commit;

	if(IsFreezedAt(date))
		return Protection::Freeze;

	return Protection::None;
}

void User::AddFreeze(std::int32_t expire_in_days, std::string &&reason, Date today){
	Date expire = (date::sys_days)today + date::days(expire_in_days);

	Freezes.push_back({today, expire, std::nullopt, std::nullopt, false, std::move(reason)});
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

std::optional<std::int64_t> User::UseAnyFreeze(Date date, FreezeUsedBy by) {
	if (AreActiveProtected(date)) {
		LogUser(Error, "Using freeze on a protected day");
		return std::nullopt;
	}

	for (auto i = 0; i < Freezes.size(); i++) {
		auto &freeze = Freezes[i];
		
		//TODO: use best freeze possible
		if (freeze.CanBeUsedAt(date)) {
			freeze.UseAt(date, by);
			return i;
		}
	}

	return std::nullopt;
}

std::optional<std::int64_t> User::UseFreeze(Date date, std::int64_t freeze_id, FreezeUsedBy by) {
	if(AreActiveProtected(date)){
		LogUser(Error, "using freeze on an already protected day");
		return std::nullopt;
	}

	if(!ActiveStreaks(date).size()){
		LogUser(Error, "using freeze without a streak");
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

	freeze.UseAt(date, by);

	return freeze_id;
}

template<typename PredType>
std::optional<Date> User::FnCommitEver(PredType pred)const {
	std::optional<Date> result;

	for (const auto &streak : Streaks) {
		auto first = streak.FirstCommitDate();

		if(!first.has_value())
			continue;

		if(!result.has_value()){
			result = first;
			continue;
		}

		result = pred(result.value(), first.value());
	}

	return result;
}

std::optional<Date> User::FirstCommitEver()const {
	return FnCommitEver([](auto &l, auto &r){return std::min(l, r);});
}

std::optional<Date> User::LastCommitEver()const {
	return FnCommitEver([](auto &l, auto &r){return std::max(l, r);});
}

std::vector<std::int64_t> User::AutoFreezeExcept(Date today) {
	auto first = FirstCommitEver();
	auto last = LastCommitEver();

	if(!first.has_value() || !last.has_value())
		return {};

	Date begin = first.value();
	Date end = std::max(last.value(), today);

	std::vector<std::int64_t> freezes;

	for (auto date : DateUtils::Range(begin, end)) {
		if(date == today)
			break;

		if(AreActiveProtected(date))
			continue;

		std::optional<std::int64_t> index = UseAnyFreeze(date, FreezeUsedBy::Auto);
		
		if(index.has_value())
			freezes.push_back(index.value());
	}

	return freezes;
}

bool User::CanUseFreezeAt(std::int64_t freeze_id, Date date)const{
	if(freeze_id >= Freezes.size())
		return (LogUser(Error, "Invalid freeze id"), freeze_id);

	return Freezes[freeze_id].CanBeUsedAt(date);
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

