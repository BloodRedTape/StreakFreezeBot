#include "model.hpp"
#include <bsl/file.hpp>
#include <cassert>

bool StreakFreeze::CanBeUsed() const{
	return CanBeUsedAt(DateUtils::Now());
}

bool StreakFreeze::CanBeUsedAt(Date date) const{
	bool cannot = ExpireAt < date || UsedAt.has_value();

	return !cannot;
}

bool User::IsCommitedAt(Date date)const {
	return !IsFreezedAt(date) && date <= LastCommitment;
}

bool User::IsFreezedAt(Date date)const {
	for (auto freeze : Freezes) {
		if(freeze.UsedAt.has_value() && freeze.UsedAt.value() == date)
			return true;
	}

	return false;
}

bool User::IsBurnedOutAt(Date date)const {
	auto history = GatherHistory(StreakStart, date);

	if(history.size())
		history.pop_back();
	
	for (auto it = history.rbegin(); it != history.rend(); ++it) {
		if(it->second == Protection::None)
			return true;
	}

	return false;
}

std::vector<std::pair<Date, Protection>> User::GatherHistory(Date from, Date to)const {
	std::vector<std::pair<Date, Protection>> history;

	for (Date date : DateUtils::Range(from, to)) {
		assert(!(IsFreezedAt(date) && IsCommitedAt(date)));

		if(IsFreezedAt(date))
			history.emplace_back(date, Protection::Freeze);
		else if(IsCommitedAt(date))
			history.emplace_back(date, Protection::Commit);
		else
			history.emplace_back(date, Protection::None);
	}

	return history;
}

std::vector<std::pair<Date, Protection>> User::GatherHistory()const {
	return GatherHistory(StreakStart, DateUtils::Now());
}

StreakDatabase::StreakDatabase(const INIReader& config):
	m_Filepath(
		config.Get(SectionName, "Filepath", "")
	)
{
	try{
		m_Users = nlohmann::json::parse(ReadEntireFile(m_Filepath), nullptr, false, true);
	}catch(...){}
}

void StreakDatabase::AddFreeze(std::int64_t user, std::int32_t expire_in_days){
	Date now = DateUtils::Now();
	Date expire = (date::sys_days)now + date::days(expire_in_days);
	m_Users[user].Freezes.push_back({now, expire, std::nullopt});

	SaveToFile();
}

std::vector<StreakFreeze> StreakDatabase::AvailableFreezes(std::int64_t user) const{
	std::vector<StreakFreeze> result;

	Date now = DateUtils::Now();

	for (const auto &freeze : m_Users[user].Freezes) {
		if(!freeze.CanBeUsedAt(now))
			continue;

		result.push_back(freeze);
	}

	return result;
}

std::optional<StreakFreeze> StreakDatabase::UseFreeze(std::int64_t user){
	auto &freezes = m_Users[user].Freezes;
	std::sort(freezes.begin(), freezes.end());

	Date now = DateUtils::Now();

	for (auto& freeze : freezes) {
		if (!freeze.CanBeUsedAt(now))
			continue;
		freeze.UsedAt = std::make_optional(now);
		SaveToFile();
		return {freeze};
	}

	return std::nullopt;
}

std::int64_t StreakDatabase::Streak(std::int64_t user)const {
	auto history = GatherHistory(user);
	
	std::int64_t streak = 0;

	for (auto day : history) {
		if(day.second == Protection::None)
			break;

		streak++;
	}
	
	return streak;
}

void StreakDatabase::ResetStreak(std::int64_t user) {
	m_Users[user].StreakStart = DateUtils::Now();
	m_Users[user].LastCommitment = (date::sys_days)m_Users[user].StreakStart - date::days(1);
	m_Users[user].Freezes.clear();
	SaveToFile();
}

bool StreakDatabase::Commit(std::int64_t user) {
	if(IsCommitedToday(user))
		return true;

	if(IsStreakBurnedOut(user))
		return (ResetStreak(user), false); // Streak is burned out, Reset

	m_Users[user].LastCommitment = DateUtils::Now();
	SaveToFile();

	return true;
}

bool StreakDatabase::IsCommitedToday(std::int64_t user)const {
	return m_Users[user].IsCommitedAt(DateUtils::Now());
}

bool StreakDatabase::IsFreezedToday(std::int64_t user)const {
	return m_Users[user].IsFreezedAt(DateUtils::Now());
}

bool StreakDatabase::IsStreakBurnedOut(std::int64_t user)const {
	return m_Users[user].IsBurnedOutAt(DateUtils::Now());
}

std::vector<std::pair<Date, Protection>> StreakDatabase::GatherHistory(std::int64_t user)const {
	return m_Users[user].GatherHistory();
}

void StreakDatabase::SaveToFile(){
	WriteEntireFile(m_Filepath, nlohmann::json(m_Users).dump());
}

