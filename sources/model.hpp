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

	bool CanBeUsed()const;

	bool CanBeUsedAt(Date date)const;
};

inline bool operator<(const StreakFreeze& lhs, const StreakFreeze& rhs) {
	return lhs.ExpireAt < rhs.ExpireAt;
}

enum class Protection{
    Commit,
    Freeze,
    None
};

struct User {
	std::vector<StreakFreeze> Freezes;
	Date StreakStart = DateUtils::Now();
    Date LastCommitment = DateUtils::Now();

    bool IsCommitedAt(Date date)const;

    bool IsFreezedAt(Date date)const;

    bool IsProtected(Date date)const{ return IsCommitedAt(date) || IsFreezedAt(date); }
    
    bool IsBurnedOutAt(Date date)const;
    
    bool HasFreezeAt(Date date)const;

    std::vector<std::pair<Date, Protection>> GatherHistory(Date from, Date to)const;

    std::vector<std::pair<Date, Protection>> GatherHistory()const;
};

class StreakDatabase{
    static constexpr const char *SectionName = "StreakDatabase";
private:
	mutable std::unordered_map<std::int64_t, User> m_Users;
	std::string m_Filepath;
public:
	StreakDatabase(const INIReader &config);

	void AddFreeze(std::int64_t user, std::int32_t expire_in_days);

	std::vector<StreakFreeze> AvailableFreezes(std::int64_t user)const;

	std::optional<StreakFreeze> UseFreeze(std::int64_t user);

	std::int64_t Streak(std::int64_t user)const;

	void ResetStreak(std::int64_t user);

	bool Commit(std::int64_t user);

    bool IsCommitedToday(std::int64_t user)const;

    bool IsFreezedToday(std::int64_t user)const;

    bool IsStreakBurnedOut(std::int64_t user)const;

    std::vector<std::pair<Date, Protection>> GatherHistory(std::int64_t user)const;

    const std::unordered_map<std::int64_t, User> &Users()const{ return m_Users; }

private:
	void SaveToFile();
};

inline void to_json(nlohmann::json& j, const StreakFreeze& sf) {
    to_json(j["EarnedAt"], sf.EarnedAt);
    to_json(j["ExpireAt"], sf.ExpireAt);

    if(sf.UsedAt.has_value())
        to_json(j["UsedAt"], sf.UsedAt.value());
}

inline void from_json(const nlohmann::json& j, StreakFreeze& sf) {
    from_json(j.at("EarnedAt"), sf.EarnedAt);
    from_json(j.at("ExpireAt"),sf.ExpireAt);
    if (j.contains("UsedAt") && !j.at("UsedAt").is_null()) {
        from_json(j.at("UsedAt"), sf.UsedAt.value());
    } else {
        sf.UsedAt.reset();
    }
}

inline void to_json(nlohmann::json& j, const User& user) {
    j = nlohmann::json{
        {"Freezes", user.Freezes}
    };
    to_json(j["StreakStart"], user.StreakStart);
    to_json(j["LastCommitment"], user.LastCommitment);
}

inline void from_json(const nlohmann::json& j, User& user) {
    j.at("Freezes").get_to(user.Freezes);
    from_json(j["StreakStart"], user.StreakStart);
    from_json(j["LastCommitment"], user.LastCommitment);
}