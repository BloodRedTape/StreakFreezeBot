#pragma once

#include <vector>
#include <unordered_map>
#include "streak.hpp"
#include "todo.hpp"
#include "challenge.hpp"
#include "ranges.hpp"
#include "user_preferences.hpp"

struct FriendInfo {
    std::int64_t Id = 0;
    std::int64_t Streak = 0;
    Protection TodayProtection = Protection::None;

    std::string Username;
    std::string FullName;

    NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(FriendInfo, Id, Streak, TodayProtection, Username, FullName)
};

struct PendingSubmition{
    std::vector<std::int64_t> Ids;
    Date At;

    NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(PendingSubmition, Ids, At)
};

class User {
public:
    static constexpr size_t InvalidIndex = -1;
private:
	std::vector<StreakFreeze> Freezes;
    std::int64_t MaxFreezes = 2;
    std::vector<std::int64_t> Friends;
    std::vector<Streak> Streaks;

    UserPreferences Preferences;

    mutable PendingSubmition TodaySubmition;
public:
    NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(User, Freezes, MaxFreezes, Friends, Streaks, Preferences, TodaySubmition)
public:

    User() = default;

    User(std::vector<StreakFreeze> &&freezes, std::int64_t max_freezes, std::vector<std::int64_t> &&friends, std::vector<Streak> &&streaks);
    
    bool AddStreak(const std::string &descr);

    bool HasStreak(const std::string &descr)const;

    void AddChallengeStreak(const std::string &descr, std::int64_t challenge);

    void RemoveStreak(std::int64_t streak_id);

	void RemoveChallengeStreaks(std::int64_t challenge_id);

    Streak *GetStreak(std::int64_t id);

    const Streak* GetStreak(std::int64_t id)const {
        return const_cast<User*>(this)->GetStreak(id);
    }

    Streak *GetStreak(const std::string &descr);

    const std::vector<Streak> &GetStreaks()const{ return Streaks; }

    std::vector<Streak> GetStreaksWithPayload()const{ return Streaks; }

    UserPreferences &GetPreferences(){ return Preferences; }

    const UserPreferences &GetPreferences()const{ return Preferences; }

    std::vector<std::int64_t> &SubmitionFor(Date today)const;

    auto StreakIdsRange()const { return rx::seq() | rx::first_n(Streaks.size()) | filter(this, &User::IsValidStreak); }

    auto StreaksRange()const {
        return GetStreaks();
    }

    bool IsValidStreak(std::int64_t streak)const{ return streak < Streaks.size(); }

    bool IsFreezedAt(Date date)const;

    bool IsFreezedByAt(Date date, FreezeUsedBy by)const;

    const std::vector<StreakFreeze> &GetFreezes()const{ return Freezes; }

    void AddFreeze(std::int32_t expire_in_days, std::string &&reason, Date today);

    void RemoveFreeze(std::size_t freeze_id);

    bool HasAnyFreezable(Date today)const;

    bool HasSomethingToFreeze(Date today)const;

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