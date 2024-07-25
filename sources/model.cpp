#include "model.hpp"
#include <bsl/file.hpp>
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <cassert>

DEFINE_LOG_CATEGORY(Model)

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

void StreakDatabase::AddFreeze(std::int64_t user, std::int32_t expire_in_days, std::string &&reason, Date today){
	m_Users[user].AddFreeze(expire_in_days, std::move(reason), today);

	SaveToFile();
}

void StreakDatabase::RemoveFreeze(std::int64_t user, std::size_t freeze_id) {
	//Possible bug of removing autoused freeze????
	m_Users[user].RemoveFreeze(freeze_id);

	SaveToFile();
}

std::vector<std::size_t> StreakDatabase::AvailableFreezes(std::int64_t user, Date today) const{
	EnsureAutoFreeze(user, today);

	return m_Users[user].AvailableFreezes(today);
}

std::optional<std::int64_t> StreakDatabase::UseFreeze(std::int64_t user, Date today, std::size_t freeze_id){
	EnsureAutoFreeze(user, today);

	defer{ SaveToFile(); };

	return m_Users[user].UseFreeze(today, freeze_id);
}

std::optional<std::int64_t> StreakDatabase::UseAnyFreeze(std::int64_t user, Date today){
	EnsureAutoFreeze(user, today);

	defer{ SaveToFile(); };

	return m_Users[user].UseAnyFreeze(today);
}

std::int64_t StreakDatabase::Streak(std::int64_t user, Date today)const {
	EnsureAutoFreeze(user, today);
	
	return m_Users[user].Streak(today);
}

void StreakDatabase::ResetStreak(std::int64_t user) {
	m_Users[user] = {};

	SaveToFile();
}

bool StreakDatabase::Commit(std::int64_t user, Date today) {
	EnsureAutoFreeze(user, today);
	
	defer{ SaveToFile(); };

	return m_Users[user].Commit(today);
}

std::vector<Protection> StreakDatabase::History(std::int64_t id, Date today)const{
	EnsureAutoFreeze(id, today);

	return m_Users[id].HistoryForToday(today);
}

bool StreakDatabase::CanAddFreeze(std::int64_t user, Date today)const {
	return m_Users[user].CanAddFreeze(today);
}

void StreakDatabase::AddFriends(std::int64_t first, std::int64_t second){
	m_Users[first].AddFriend(second);
	m_Users[second].AddFriend(first);

	SaveToFile();
}

void StreakDatabase::RemoveFriends(std::int64_t first, std::int64_t second){
	m_Users[first].RemoveFriend(second);
	m_Users[second].RemoveFriend(first);

	SaveToFile();
}

std::vector<FriendInfo> StreakDatabase::GetFriendsInfo(std::int64_t user, Date today)const {
	std::vector<FriendInfo> result;
	 
	for (std::int64_t id: m_Users[user].GetFriends()) {
		auto &f = m_Users[id];

		result.push_back({id, f.Streak(today), f.ProtectionAt(today)});
	}

	return result;
}

void StreakDatabase::EnsureAutoFreeze(std::int64_t user, Date today)const {
	if(m_Users[user].AutoFreezeExcept(today).size())
		SaveToFile();
}

User& StreakDatabase::GetUser(std::int64_t user, Date today)const {
	m_Users[user].AutoFreezeExcept(today);

	return m_Users[user];
}

void StreakDatabase::SaveToFile()const{
	WriteEntireFile(m_Filepath, nlohmann::json(m_Users).dump());
}

