#include "challenge.hpp"


ChallengeStatus Challenge::GetStatus(Date today)const {
	if(Type != ChallengeType::Duration){
		assert(false);
		return ChallengeStatus::Pending;
	}
	
	if(today < Start)
		return ChallengeStatus::Pending;

	assert(Duration);

	Date day_after_finish = date::sys_days(Start) + date::days(Duration);

	if(today < day_after_finish)
		return ChallengeStatus::Running;

	return ChallengeStatus::Finished;
}

bool Challenge::CanJoin(Date today)const {
	return GetStatus(today) == ChallengeStatus::Pending || Start == today;
}

void Challenge::Add(std::int64_t user){
	if (Has(user)){
		assert(false);
		return;
	}

	Participants.push_back(user);
}

void Challenge::Remove(std::int64_t user){
	if (!Has(user)){
		assert(false);
		return;
	}

	auto it = std::find(Participants.begin(), Participants.end(), (user));

	if(it == Participants.end() || !Participants.size())
		return;

	auto index = it - Participants.begin();

	for (auto i = index; i < Participants.size() - 1; i++) {
		std::swap(Participants[i], Participants[i + 1]);
	}

	Participants.pop_back();
}

bool Challenge::Has(std::int64_t user)const{
	return std::count(Participants.begin(), Participants.end(), user);
}

bool Challenge::Validate(std::int64_t user){
	if(Creator != user)
		Creator = user;

	return ToDo.size() && Name.size() && Duration && Duration <= 365 && Type != ChallengeType::Unknown;
}

std::int64_t Challenge::DayOfChallenge(Date today) const{
	if(today < Start)
		return 0;

	auto day_from_start = DateUtils::DaysDiff(today, Start);

	if(day_from_start < Duration)
		return day_from_start;

	return Duration - 1;
}

