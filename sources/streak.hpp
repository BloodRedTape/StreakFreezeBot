#pragma once

#include <optional>
#include "json.hpp"
#include "time.hpp"
#include "freeze.hpp"

enum class Protection{
    None,
    Commit,
    Freeze,
    NothingToProtect
};

std::string ToString(Protection protection);

enum class StreakStatus {
    Default,
    Removed
};

struct Streak{
    static constexpr std::size_t DescriptionLimit = 70;

    std::vector<Date> Commits;
	std::string Description;
    StreakStatus Status = StreakStatus::Default;
    std::optional<std::int32_t> Challenge;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(Streak, Commits, Description, Status, Challenge)

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

    bool IsChallenge()const {
        return Challenge.has_value();
    }

    bool IsFromChallenge(std::int64_t challenge_id)const {
        return Challenge.has_value() && Challenge.value() == challenge_id;
    }

    bool IsFreezable()const {
        return !IsChallenge();
    }

    std::optional<Date> FirstCommitDate()const;

    bool Commit(Date date);

    std::int64_t Count(Date today, const std::vector<StreakFreeze> &freezes)const;

    bool NoCount(Date today, const std::vector<StreakFreeze> &freezes)const{ return Count(today, freezes) == 0; }

    std::vector<Protection> History(Date start, Date end, const std::vector<StreakFreeze> &freezes)const;

    std::vector<Protection> HistoryForToday(Date today, const std::vector<StreakFreeze> &freezes)const;

    Protection ProtectionAt(Date date, const std::vector<StreakFreeze> &freezes)const;

};

struct StreakPayload {
    std::int64_t Id = 0;
    std::vector<Protection> History;
    Date Start;
    std::int64_t Count = 0;
    bool Required = false;
    bool Freezable = false;

    StreakPayload() = default;

    StreakPayload(const StreakPayload &) = default;

    StreakPayload(StreakPayload &&other)noexcept;

    StreakPayload &operator=(const StreakPayload &) = default;

    StreakPayload &operator=(StreakPayload &&other)noexcept;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(StreakPayload, Id, History, Start, Count, Required, Freezable)
};