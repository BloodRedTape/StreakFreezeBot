#pragma once

#include <vector>
#include "freeze.hpp"

enum class Protection{
    None,
    Commit,
    Freeze
};

struct FriendInfo {
    std::int64_t Id = 0;
    std::int64_t Streak = 0;
    Protection TodayProtection = Protection::None;

    std::string Username;
    std::string FullName;

    NLOHMANN_DEFINE_TYPE_INTRUSIVE(FriendInfo, Id, Streak, TodayProtection, Username, FullName)
};

class User {
public:
    static constexpr size_t InvalidIndex = -1;
private:
	std::vector<StreakFreeze> Freezes;
    std::vector<Date> Commits;
    std::int64_t MaxFreezes = 2;
    std::vector<std::int64_t> Friends;
public:
    bool IsCommitedAt(Date date)const;

    bool IsFreezedAt(Date date)const;

    bool IsProtected(Date date)const{ return IsCommitedAt(date) || IsFreezedAt(date); }

    std::optional<Date> FirstCommitDate()const;

    bool Commit(Date date);

    std::vector<Protection> History(Date start, Date end)const;

    std::vector<Protection> HistoryForToday(Date today)const;

    Protection ProtectionAt(Date date)const;

    void AddFreeze(std::int32_t expire_in_days, std::string &&reason, Date today);

    void RemoveFreeze(std::size_t freeze_id);

    std::vector<std::size_t> AvailableFreezes(Date today) const;

    bool CanAddFreeze(Date today)const;

    std::int64_t Streak(Date today)const;

    std::optional<std::int64_t> UseAnyFreeze(Date date);

    std::optional<std::int64_t> UseFreeze(Date date, std::int64_t freeze_id);

    std::vector<std::int64_t> AutoFreezeExcept(Date today);

    void AddFriend(std::int64_t id);

    void RemoveFriend(std::int64_t id);

    bool HasFriend(std::int64_t id)const;

    const std::vector<std::int64_t> &GetFriends()const{ return Friends; }

    NLOHMANN_DEFINE_TYPE_INTRUSIVE(User, Freezes, Commits, MaxFreezes, Friends)
};