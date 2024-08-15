#include "model.hpp"
#include <bsl/file.hpp>
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <bsl/stdlib.hpp>
#include <cassert>

DEFINE_LOG_CATEGORY(Model)

StreakDatabase::StreakDatabase(const INIReader& config):
	m_DatabaseFolder(
		config.Get(SectionName, "DatabaseFolder", "./db")
	),
	m_UsersFolder(
		m_DatabaseFolder + "/user"
	)
{
	std::filesystem::create_directories(m_UsersFolder);

	for (auto entry : std::filesystem::directory_iterator(m_UsersFolder)) {
		if(!entry.is_regular_file())
			continue;

		std::string user = entry.path().stem().string();
		
		auto id = ErrnoSafeCall(&std::atoll, user.c_str());

		if(!id.has_value())
			continue;
		
		auto path = entry.path();

		try{
			auto user_json = nlohmann::json::parse(ReadEntireFile(path.string()), nullptr, false, true);

			m_Users[id.value()] = user_json;
		}catch(const std::exception &e){
			Println("Can't parse json at %, because: %", path, e.what());
		}
	}
}

void StreakDatabase::AddFriends(std::int64_t first, std::int64_t second){
	m_Users[first].AddFriend(second);
	m_Users[second].AddFriend(first);

	SaveUserToFile(first);
	SaveUserToFile(second);
}

void StreakDatabase::RemoveFriends(std::int64_t first, std::int64_t second){
	m_Users[first].RemoveFriend(second);
	m_Users[second].RemoveFriend(first);

	SaveUserToFile(first);
	SaveUserToFile(second);
}

std::vector<FriendInfo> StreakDatabase::GetFriendsInfo(std::int64_t user, Date today)const {
	std::vector<FriendInfo> result;
	 
	for (std::int64_t id: m_Users[user].GetFriends()) {
		auto &f = m_Users[id];

		result.push_back({id, f.ActiveCount(today), f.ActiveProtection(today)});
	}

	return result;
}

void StreakDatabase::EnsureAutoFreeze(std::int64_t user, Date today)const {
	if(m_Users[user].AutoFreezeExcept(today).size())
		SaveUserToFile(user);
}

User& StreakDatabase::GetUser(std::int64_t user, Date today)const {
	m_Users[user].AutoFreezeExcept(today);

	return m_Users[user];
}

User& StreakDatabase::GetUserNoAutoFreeze(std::int64_t user, Date today)const {
	return m_Users[user];
}

std::vector<std::int64_t> StreakDatabase::GetUsers() const{
	std::vector<std::int64_t> users;

	for (const auto& [user, _]: m_Users)
		users.push_back(user);

	return users;
}

void StreakDatabase::SaveUserToFile(std::int64_t user)const{
	auto path = std::filesystem::path(m_UsersFolder) / Format("%.json", user);

	WriteEntireFile(path.string(), nlohmann::json(m_Users[user]).dump());
}

