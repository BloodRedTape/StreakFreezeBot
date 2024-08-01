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

	void AddFreeze(std::int64_t user, std::int32_t expire_in_days, std::string &&reasona, Date today);

	void RemoveFreeze(std::int64_t user, std::size_t freeze_id);

	std::vector<std::size_t> AvailableFreezes(std::int64_t user, Date today)const;

	std::optional<std::int64_t> UseFreeze(std::int64_t user, Date today, std::size_t freeze_id, FreezeUsedBy by);

	std::optional<std::int64_t> UseAnyFreeze(std::int64_t user, Date today, FreezeUsedBy by);

	std::int64_t Streak(std::int64_t user, Date today)const;

	void ResetStreak(std::int64_t user);

	bool Commit(std::int64_t user, Date today);

    std::vector<Protection> History(std::int64_t user, Date today)const;

	bool CanAddFreeze(std::int64_t user, Date today)const;

    void AddFriends(std::int64_t first, std::int64_t second);

    void RemoveFriends(std::int64_t first, std::int64_t second);

    std::vector<FriendInfo> GetFriendsInfo(std::int64_t user, Date today)const;

    void EnsureAutoFreeze(std::int64_t user, Date today)const;

    User &GetUser(std::int64_t user, Date today)const;

	std::vector<std::int64_t> GetUsers()const;

	void SaveUserToFile(std::int64_t user)const;
};