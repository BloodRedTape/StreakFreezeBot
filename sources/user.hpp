#pragma once

#include <vector>
#include "streak.hpp"
#include "todo.hpp"

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
    std::int64_t MaxFreezes = 2;
    std::vector<std::int64_t> Friends;

    std::vector<Streak> Streaks;
public:
    NLOHMANN_DEFINE_TYPE_INTRUSIVE(User, Freezes, MaxFreezes, Friends, Streaks)
public:

    User() = default;

    User(std::vector<StreakFreeze> &&freezes, std::int64_t max_freezes, std::vector<std::int64_t> &&friends, std::vector<Streak> &&streaks);
    
    bool AddStreak(const std::string &descr);

    bool HasStreak(const std::string &descr)const;

    Streak *GetStreak(std::int64_t id);

    const std::vector<Streak> &GetStreaks()const{ return Streaks; }

    std::vector<std::int64_t> ActiveStreaks(Date today)const;

    std::vector<std::int64_t> ActivePendingStreaks(Date today)const;

    std::vector<std::int64_t> UnactiveStreaks(Date today)const;

    std::int64_t ActiveCount(Date today)const;

    bool ActiveNoCount(Date today)const{ return ActiveCount(today) == 0; }

    std::vector<Protection> ActiveHistory(Date start, Date end)const;

    std::vector<Protection> ActiveHistoryForToday(Date today)const;

    bool IsFreezedAt(Date date)const;

    bool IsFreezedByAt(Date date, FreezeUsedBy by)const;

    const std::vector<StreakFreeze> &GetFreezes()const{ return Freezes; }

    bool AreActiveProtected(Date date)const;

    bool AreActiveCommited(Date date)const;

    Protection ActiveProtection(Date date)const;

    void AddFreeze(std::int32_t expire_in_days, std::string &&reason, Date today);

    void RemoveFreeze(std::size_t freeze_id);

    std::vector<std::size_t> AvailableFreezes(Date today) const;

    bool CanAddFreeze(Date today)const;

    std::optional<std::int64_t> UseAnyFreeze(Date date, FreezeUsedBy by);

    std::optional<std::int64_t> UseFreeze(Date date, std::int64_t freeze_id, FreezeUsedBy by);
    
    template<typename PredType>
    std::optional<Date> FnCommitEver(PredType pred)const;

    std::optional<Date> FirstCommitEver()const;

    std::optional<Date> LastCommitEver()const;

    std::vector<std::int64_t> AutoFreezeExcept(Date today);

    bool CanUseFreezeAt(std::int64_t freeze_id, Date date)const;

    void AddFriend(std::int64_t id);

    void RemoveFriend(std::int64_t id);

    bool HasFriend(std::int64_t id)const;

    const std::vector<std::int64_t> &GetFriends()const{ return Friends; }
};