#include "model.hpp"
#include <bsl/file.hpp>
#include <bsl/log.hpp>
#include <cassert>

DEFINE_LOG_CATEGORY(Model)

bool StreakFreeze::CanBeUsed() const{
	return CanBeUsedAt(DateUtils::Now());
}

bool StreakFreeze::CanBeUsedAt(Date date) const{
	bool cannot = ExpireAt < date || UsedAt.has_value();

	cannot = cannot || Removed;

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
	}catch(const std::exception &e){
		Println("Can't parse json at %, because: %", m_Filepath, e.what());
	}
}

void StreakDatabase::AddFreeze(std::int64_t user, std::int32_t expire_in_days){
	Date now = DateUtils::Now();
	Date expire = (date::sys_days)now + date::days(expire_in_days);
	m_Users[user].Freezes.push_back({now, expire, std::nullopt});

	SaveToFile();
}

void StreakDatabase::RemoveFreeze(std::int64_t user, std::size_t freeze_id) {
	if(freeze_id >= m_Users[user].Freezes.size())
		return;

	m_Users[user].Freezes[freeze_id].Removed = true;

	SaveToFile();
}

std::vector<std::size_t> StreakDatabase::AvailableFreezes(std::int64_t user) const{
	std::vector<std::size_t> result;

	Date now = DateUtils::Now();

	const auto &freezes = m_Users[user].Freezes;

	for (int i = 0; i<freezes.size(); i++) {
		const auto &freeze = freezes[i];

		if(!freeze.CanBeUsedAt(now))
			continue;

		result.push_back(i);
	}

	return result;
}

std::optional<StreakFreeze> StreakDatabase::UseFreeze(std::int64_t user, Date now, std::size_t freeze_id){
	if(IsProtected(user, now)){
		LogModel(Error, "Streak is already protected");
		return std::nullopt;
	}

	if (freeze_id >= m_Users[user].Freezes.size()) {
		LogModel(Error, "Invalid FreezeId: %", freeze_id);
		return std::nullopt;
	}
	
	auto &freeze = m_Users[user].Freezes[freeze_id];
	
	if (!freeze.CanBeUsedAt(now)) {
		LogModel(Error, "FreezeId % can't be used at %", freeze_id, now);
		return std::nullopt;
	}

	freeze.UsedAt = std::make_optional(now);
	m_Users[user].Protect(Protection::Freeze, now);
	SaveToFile();
}

std::optional<StreakFreeze> StreakDatabase::UseFreeze(std::int64_t user, std::size_t freeze_id){
	return UseFreeze(user, DateUtils::Now(), freeze_id);
}

std::optional<StreakFreeze> StreakDatabase::UseAnyFreeze(std::int64_t user, Date now){
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

std::optional<StreakFreeze> StreakDatabase::UseAnyFreeze(std::int64_t user){
	return UseAnyFreeze(user, DateUtils::Now());
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
		return false;

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
bool StreakDatabase::CanAddFreeze(std::int64_t user)const {
	return AvailableFreezes(user).size() < m_Users[user].MaxFreezes;
}

void StreakDatabase::EnsureNotificationChat(std::int64_t user, std::int64_t chat) {
	if(m_Users[user].NotificationChat == chat)
		return;

	m_Users[user].NotificationChat = chat;
	SaveToFile();
}

const User& StreakDatabase::GetUser(std::int64_t user)const {
	return m_Users[user];
}

void StreakDatabase::SaveToFile(){
	WriteEntireFile(m_Filepath, nlohmann::json(m_Users).dump());
}

