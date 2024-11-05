#pragma once

#include <unordered_map>
#include <INIReader.h>
#include "user.hpp"
#include "challenge.hpp"
#include "payload.hpp"

class StreakDatabase{
    static constexpr const char *SectionName = "StreakDatabase";
private:
	mutable std::unordered_map<std::int64_t, User> m_Users;
	mutable std::unordered_map<std::int64_t, Challenge> m_Challenges;
	std::string m_DatabaseFolder;
	std::string m_UsersFolder;
	std::string m_ChallengesFolder;
public:
	StreakDatabase(const INIReader &config);

    void AddFriends(std::int64_t first, std::int64_t second);

    void RemoveFriends(std::int64_t first, std::int64_t second);

    std::vector<FriendInfo> GetFriendsInfo(std::int64_t user, Date today)const;

    void EnsureAutoFreeze(std::int64_t user, Date today)const;

    User &GetUser(std::int64_t user, Date today)const;

    User &GetUserNoAutoFreeze(std::int64_t user, Date today)const;

	bool IsActive(std::int64_t user, std::int64_t streak, Date today)const;

	bool IsActive(const Streak &streak, std::int64_t user, Date today)const;

	bool AreActiveCommited(std::int64_t user, Date today)const;

	bool AreActiveFreezedOrCommited(std::int64_t user, Date today)const;

    std::vector<Protection> ActiveHistory(std::int64_t user, Date start, Date end)const;

    std::vector<Protection> ActiveHistoryForToday(std::int64_t user, Date today)const;

    std::int64_t ActiveStreak(std::int64_t user, Date today)const;

    std::vector<std::int64_t> ActiveStreaks(std::int64_t user, Date today)const;

	std::vector<std::string> ActiveStreaksDescriptions(std::int64_t user, Date today)const;

    std::vector<std::int64_t> ActivePendingStreaks(std::int64_t user, Date today)const;

    Protection ActiveProtection(std::int64_t user, Date date)const;

	bool ActiveCommited(std::int64_t user, Date date)const {
		return ActiveProtection(user, date) == Protection::Commit;
	}

	bool ActiveProtected(std::int64_t user, Date date)const {
		return ActiveProtection(user, date) != Protection::None;
	}

	std::vector<Payload<Streak, StreakPayload>> StreaksWithPayload(std::int64_t user, Date today)const;

	std::int64_t UniqueChallengeId()const;

	std::int64_t AddChallenge(Challenge &&challenge);

	bool JoinChallenge(std::int64_t user, std::int64_t challenge, Date today);

	std::int64_t Count(std::int64_t user, std::int64_t challenge, Date today)const;

	bool CommitedChallengeAt(std::int64_t user, std::int64_t challenge, Date today)const;

	bool HasLost(std::int64_t user, std::int64_t challenge, Date today)const;

	bool CanCommitToChallenge(std::int64_t user, std::int64_t challenge, Date today)const;

	std::vector<Payload<Challenge, ChallengePayload>> ChallengesWithPayload(std::int64_t user, Date today)const;

	std::vector<Challenge> ChallengesWithoutIds(std::int64_t user)const;

	bool IsInChallenge(std::int64_t user, std::int64_t challenge)const;

    Challenge &GetChallenge(std::int64_t challenge)const;

    const auto &Challenges()const{ return m_Challenges; }

	std::vector<ChallengeParticipant> GetChallengeParticipant(std::int64_t challenge, Date today, std::function<std::string(std::int64_t)> fetch_fullname)const;

	std::vector<std::int64_t> GetUsers()const;

	void SaveUserToFile(std::int64_t user)const;

	void SaveChallengeToFile(std::int64_t challenge)const;
};