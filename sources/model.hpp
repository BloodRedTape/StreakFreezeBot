#pragma once

#include <unordered_map>
#include <vector>
#include <INIReader.h>
#include <optional>
#include "time.hpp"

struct StreakFreeze {
	Date EarnedAt;
	Date ExpireAt;
	std::optional<Date> UsedAt;
    bool Removed = false;

	bool CanBeUsed()const;

	bool CanBeUsedAt(Date date)const;
};

inline bool operator<(const StreakFreeze& lhs, const StreakFreeze& rhs) {
	return lhs.ExpireAt < rhs.ExpireAt;
}

enum class Protection{
    None,
    Commit,
    Freeze
};

struct User {
    static constexpr size_t InvalidIndex = -1;
	std::vector<StreakFreeze> Freezes;
	Date StreakStart = DateUtils::Now();
    std::vector<Protection> History;
    std::int64_t MaxFreezes = 2;
    std::int64_t NotificationChat = 0;

    bool IsCommitedAt(Date date)const;

    bool IsFreezedAt(Date date)const;

    bool IsProtected(Date date)const{ return IsCommitedAt(date) || IsFreezedAt(date); }
    
    bool HasFreezeAt(Date date)const;

    void Protect(Protection prot, Date date);

    std::size_t DateIndexUnsafe(Date date)const;

    std::size_t DateIndex(Date date)const;

    const std::vector<Protection> &HistoryAsOf(Date today);
};

class StreakDatabase{
    static constexpr const char *SectionName = "StreakDatabase";
private:
	mutable std::unordered_map<std::int64_t, User> m_Users;
	std::string m_Filepath;
public:
	StreakDatabase(const INIReader &config);

	void AddFreeze(std::int64_t user, std::int32_t expire_in_days);

	void RemoveFreeze(std::int64_t user, std::size_t freeze_id);

	std::vector<std::size_t> AvailableFreezes(std::int64_t user)const;

	std::optional<StreakFreeze> UseFreeze(std::int64_t user, Date date, std::size_t freeze_id);

	std::optional<StreakFreeze> UseFreeze(std::int64_t user, std::size_t freeze_id);

	std::optional<StreakFreeze> UseAnyFreeze(std::int64_t user, Date date);

	std::optional<StreakFreeze> UseAnyFreeze(std::int64_t user);

	std::int64_t Streak(std::int64_t user)const;

	void ResetStreak(std::int64_t user);

	bool Commit(std::int64_t user);

    bool IsCommitedToday(std::int64_t user)const;

    bool IsFreezedToday(std::int64_t user)const;

    bool IsProtectedToday(std::int64_t user)const;

    bool IsProtected(std::int64_t user, Date date)const;

    bool IsStreakBurnedOut(std::int64_t user)const;

    const std::vector<Protection> &History(std::int64_t user)const;

    Date StreakStart(std::int64_t user)const;

	bool CanAddFreeze(std::int64_t user)const;

    void EnsureNotificationChat(std::int64_t user, std::int64_t chat);

    const User &GetUser(std::int64_t user)const;

    const std::unordered_map<std::int64_t, User> &Users()const{ return m_Users; }

private:
	void SaveToFile();
};

inline void to_json(nlohmann::json& j, const StreakFreeze& sf) {
    to_json(j["EarnedAt"], sf.EarnedAt);
    to_json(j["ExpireAt"], sf.ExpireAt);

    if(sf.UsedAt.has_value())
        to_json(j["UsedAt"], sf.UsedAt.value());

    j["Removed"] = sf.Removed;
}

inline void from_json(const nlohmann::json& j, StreakFreeze& sf) {
    from_json(j.at("EarnedAt"), sf.EarnedAt);
    from_json(j.at("ExpireAt"),sf.ExpireAt);
    if (j.contains("UsedAt") && !j.at("UsedAt").is_null()) {
        Date used;
        from_json(j["UsedAt"], used);
        sf.UsedAt = used;
    } else {
        sf.UsedAt.reset();
    }
    if(j.contains("Removed"))
        j["Removed"].get_to(sf.Removed);
}

inline void to_json(nlohmann::json& j, const User& user) {
    j = nlohmann::json{
        {"Freezes", user.Freezes}
    };
    to_json(j["StreakStart"], user.StreakStart);
    to_json(j["History"], user.History);
    to_json(j["NotificationChat"], user.NotificationChat);
    j["MaxFreezes"] = user.MaxFreezes;
}

inline void from_json(const nlohmann::json& j, User& user) {
    j.at("Freezes").get_to(user.Freezes);
    from_json(j["StreakStart"], user.StreakStart);
    from_json(j["History"], user.History);
    from_json(j["NotificationChat"], user.NotificationChat);

    if(j.contains("MaxFreezes"))
        j.at("MaxFreezes").get_to(user.MaxFreezes);
}