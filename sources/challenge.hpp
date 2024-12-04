#pragma once


#include <vector>
#include <limits>
#include "json.hpp"
#include "time.hpp"

class User;

enum class ChallengeType {
	Unknown,
	Duration
};

enum class ChallengeStatus {
	Pending,
	Running,
	Finished
};

class Challenge {
	std::int64_t Creator = 0;
	ChallengeType Type = ChallengeType::Unknown;
	std::string Name;
	std::string Icon = UTF8("😆");
	std::string IconBackground = "white";
	Date Start;
	std::int64_t Duration = 0;
	std::vector<std::string> ToDo;
	std::vector<std::int64_t> Participants;
public:
	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(Challenge, Type, Name, Icon, IconBackground, Start, Duration, Creator, ToDo, Creator, Participants)
public:
	
	const auto &GetToDo()const{ return ToDo; }

	const auto &GetName()const{ return Name; }

	const auto &GetDuration()const{ return Duration; }

	const auto &GetParticipants()const{ return Participants; }

	auto GetStart()const{ return Start; }
	
	ChallengeStatus GetStatus(Date today)const;

	bool CanJoin(Date today)const;

	void Add(std::int64_t user);

	bool Has(std::int64_t user)const;

	bool Validate(std::int64_t user);

	std::int64_t DayOfChallenge(Date today)const;
};

struct ChallengePayload {
	std::int64_t Id = 0;
	std::int64_t Count = 0;
	bool HasLost = false;
	std::int64_t DayOfChallenge = 0;
	bool CanJoin = false;
	ChallengeStatus Status = ChallengeStatus::Pending;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(ChallengePayload, Id, Count, HasLost, DayOfChallenge, CanJoin, Status)
};


struct ChallengeParticipant {
	std::int64_t Id = 0;
	std::string FullName;
	std::string Username;
	std::int64_t Count = 0;
	bool HasLost = false;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(ChallengeParticipant, Id, FullName, Username, Count, HasLost)
};
