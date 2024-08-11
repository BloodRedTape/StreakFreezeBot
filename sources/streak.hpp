#pragma once

#include <optional>
#include "json.hpp"
#include "time.hpp"
#include "freeze.hpp"

enum class Protection{
    None,
    Commit,
    Freeze
};

struct Streak{
    static constexpr std::size_t DescriptionLimit = 70;

    std::vector<Date> Commits;
	std::string Description;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE(Streak, Commits, Description)

    Streak() = default;
    
    Streak(Streak &&) = default;

    Streak(const Streak &) = default;

    Streak(const std::string &descr, const std::vector<Date> &commits = {}) :
        Description(descr),
        Commits(commits)
    {}

    Streak &operator=(const Streak &) = default;

    Streak &operator=(Streak &&) = default;

    bool IsCommitedAt(Date date)const;

    bool IsFreezedAt(Date date, const std::vector<StreakFreeze> &freezes)const;

    bool IsProtectedAt(Date date, const std::vector<StreakFreeze>& freezes)const {
        return IsCommitedAt(date) || IsFreezedAt(date, freezes);
    }

    bool IsProtected(Date start, Date end, const std::vector<StreakFreeze>& freezes)const;

    std::optional<Date> FirstCommitDate()const;

    bool Commit(Date date);

    std::int64_t Count(Date today, const std::vector<StreakFreeze> &freezes)const;

    bool NoCount(Date today, const std::vector<StreakFreeze> &freezes)const{ return Count(today, freezes) == 0; }

    std::vector<Protection> History(Date start, Date end, const std::vector<StreakFreeze> &freezes)const;

    std::vector<Protection> HistoryForToday(Date today, const std::vector<StreakFreeze> &freezes)const;

    Protection ProtectionAt(Date date, const std::vector<StreakFreeze> &freezes)const;

};