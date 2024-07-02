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
	auto idx = DateIndex(date);

	if(idx == InvalidIndex || idx >= History.size())
		return false;

	return History[idx] == Protection::Commit;
}

bool User::IsFreezedAt(Date date)const {
	auto idx = DateIndex(date);

	if(idx == InvalidIndex || idx >= History.size())
		return false;

	return History[idx] == Protection::Freeze;
}

std::size_t User::DateIndex(Date date)const {
	if(date < StreakStart)
		return InvalidIndex;

	return (date::sys_days(date) - date::sys_days(StreakStart)).count();
}

void User::Protect(Protection prot, Date date) {
	auto idx = DateIndex(date);

	assert(idx == History.size());

	History.push_back(prot);
}

const std::vector<Protection>& User::HistoryAsOf(Date today) {
	auto idx = DateIndex(today);

	if(idx == User::InvalidIndex)
		return History;
	
	for(int i = History.size(); i<idx; i++) 
		Protect(Protection::None, date::sys_days(StreakStart) + date::days(i));

	return History;
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

std::optional<StreakFreeze> StreakDatabase::UseFreeze(std::int64_t user, Date now){
	if(IsProtectedToday(user))
		return std::nullopt;

	auto &freezes = m_Users[user].Freezes;
	std::sort(freezes.begin(), freezes.end());

	for (auto& freeze : freezes) {
		if (freeze.CanBeUsedAt(now)) {
			freeze.UsedAt = std::make_optional(now);
			m_Users[user].Protect(Protection::Freeze, now);
			SaveToFile();
			return {freeze};
		}
	}

	return std::nullopt;
}

std::optional<StreakFreeze> StreakDatabase::UseFreeze(std::int64_t user){
	return UseFreeze(user, DateUtils::Now());
}

std::int64_t StreakDatabase::Streak(std::int64_t user)const {
	std::int64_t streak = 0;

	for (auto day : History(user)) {
		if(day == Protection::None)
			break;

		streak++;
	}
	
	return streak;
}

void StreakDatabase::ResetStreak(std::int64_t user) {
	m_Users[user].StreakStart = DateUtils::Now();
	m_Users[user].Freezes.clear();
	m_Users[user].History.clear();
	SaveToFile();
}

bool StreakDatabase::Commit(std::int64_t user) {
	if(IsProtectedToday(user))
		return true;

	if(IsStreakBurnedOut(user))
		return (ResetStreak(user), false); // Streak is burned out, Reset
	
	m_Users[user].Protect(Protection::Commit, DateUtils::Now());

	SaveToFile();

	return true;
}

bool StreakDatabase::IsCommitedToday(std::int64_t user)const {
	return m_Users[user].IsCommitedAt(DateUtils::Now());
}

bool StreakDatabase::IsFreezedToday(std::int64_t user)const {
	return m_Users[user].IsFreezedAt(DateUtils::Now());
}

bool StreakDatabase::IsProtectedToday(std::int64_t user)const {
	return IsProtected(user, DateUtils::Now());
}
bool StreakDatabase::IsProtected(std::int64_t user, Date date)const {
	return m_Users[user].IsProtected(date);
}

bool StreakDatabase::IsStreakBurnedOut(std::int64_t user)const {
	for (auto day : History(user)) {
		if(day == Protection::None)
			return true;
	}
	return false;
}

const std::vector<Protection> &StreakDatabase::History(std::int64_t user)const {
	return m_Users[user].HistoryAsOf(DateUtils::Now());
}

Date StreakDatabase::StreakStart(std::int64_t user)const {
	return m_Users[user].StreakStart;
}

void StreakDatabase::EnsureNotificationChat(std::int64_t user, std::int64_t chat) {
	if(m_Users[user].NotificationChat == chat)
		return;

	m_Users[user].NotificationChat = chat;
	SaveToFile();
}

void StreakDatabase::SaveToFile(){
	WriteEntireFile(m_Filepath, nlohmann::json(m_Users).dump());
}

