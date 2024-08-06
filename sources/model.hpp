#pragma once

#include <unordered_map>
#include <INIReader.h>
#include "user.hpp"

class StreakDatabase{
    static constexpr const char *SectionName = "StreakDatabase";
private:
	mutable std::unordered_map<std::int64_t, User> m_Users;
	std::string m_DatabaseFolder;
	std::string m_UsersFolder;
public:
	StreakDatabase(const INIReader &config);

    void AddFriends(std::int64_t first, std::int64_t second);

    void RemoveFriends(std::int64_t first, std::int64_t second);

    std::vector<FriendInfo> GetFriendsInfo(std::int64_t user, Date today)const;

    void EnsureAutoFreeze(std::int64_t user, Date today)const;

    User &GetUser(std::int64_t user, Date today)const;

    User &GetUserNoAutoFreeze(std::int64_t user, Date today)const;

	std::vector<std::int64_t> GetUsers()const;

	void SaveUserToFile(std::int64_t user)const;
};