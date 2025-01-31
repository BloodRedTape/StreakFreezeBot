#include "model.hpp"
#include <bsl/file.hpp>
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <bsl/stdlib.hpp>
#include <cassert>
#include <random>

DEFINE_LOG_CATEGORY(Model)

StreakDatabase::StreakDatabase(const INIReader& config):
	m_DatabaseFolder(
		config.Get(SectionName, "DatabaseFolder", "./db")
	),
	m_UsersFolder(
		m_DatabaseFolder + "/user"
	),
	m_ChallengesFolder(
		m_DatabaseFolder + "/challenge"
	),
	m_TokensFilepath(
		m_DatabaseFolder + "/tokens.json"
	)
{
	std::filesystem::create_directories(m_UsersFolder);
	std::filesystem::create_directories(m_ChallengesFolder);

	for (auto entry : std::filesystem::directory_iterator(m_UsersFolder)) {
		if(!entry.is_regular_file())
			continue;

		std::string user = entry.path().stem().string();
		
		auto id = ErrnoSafeCall(&std::atoll, user.c_str());

		if(!id.has_value())
			continue;
		
		auto path = entry.path();

		try{
			auto user_json = nlohmann::json::parse(ReadEntireFile(path.string()), nullptr, false, true);
			
			User user = user_json;

			m_Users.emplace(id.value(), std::move(user));
		}catch(const std::exception &e){
			Println("Can't parse user at %, because: %", path, e.what());
		}
	}

	for (auto entry : std::filesystem::directory_iterator(m_ChallengesFolder)) {
		if(!entry.is_regular_file())
			continue;

		std::string challenge_id = entry.path().stem().string();
		
		auto id = ErrnoSafeCall(&std::atoll, challenge_id.c_str());

		if(!id.has_value())
			continue;
		
		auto path = entry.path();

		try {
			nlohmann::json challenge_json = nlohmann::json::parse(ReadEntireFile(path.string()), nullptr, false, true);
			
			Challenge challenge = challenge_json;

			m_Challenges.emplace(id.value(), std::move(challenge));
		} catch(const std::exception &e) {
			Println("Can't parse challenge at %, because: %", path, e.what());
		}
	}

	try {
		auto tokens_file_content = ReadEntireFile(m_TokensFilepath);

		nlohmann::json tokens = nlohmann::json::parse(tokens_file_content, nullptr, false, true);

		m_Tokens = tokens;
	} catch (const std::exception& e) {
		Println("Can't parse tokens, because: %", e.what());
	}
}

void StreakDatabase::AddFriends(std::int64_t first, std::int64_t second){
	m_Users[first].AddFriend(second);
	m_Users[second].AddFriend(first);

	SaveUserToFile(first);
	SaveUserToFile(second);
}

void StreakDatabase::RemoveFriends(std::int64_t first, std::int64_t second){
	m_Users[first].RemoveFriend(second);
	m_Users[second].RemoveFriend(first);

	SaveUserToFile(first);
	SaveUserToFile(second);
}

std::vector<FriendInfo> StreakDatabase::GetFriendsInfo(std::int64_t user, Date today)const {
	std::vector<FriendInfo> result;
	 
	for (std::int64_t id: m_Users[user].GetFriends())
		result.push_back({id, ActiveStreak(id, today), ActiveProtection(id, today)});

	return result;
}

void StreakDatabase::EnsureAutoFreeze(std::int64_t user, Date today)const {
	if(m_Users[user].AutoFreezeExcept(today).size())
		SaveUserToFile(user);
}

User& StreakDatabase::GetUser(std::int64_t user, Date today)const {
	m_Users[user].AutoFreezeExcept(today);

	return m_Users[user];
}

User& StreakDatabase::GetUserNoAutoFreeze(std::int64_t user, Date today)const {
	return m_Users[user];
}

bool StreakDatabase::IsActive(std::int64_t user_id, std::int64_t streak_id, Date today) const{
	auto &user = GetUserNoAutoFreeze(user_id, today);

	if(!user.IsValidStreak(streak_id)){
		LogModel(Error, "Invalid streak id %", streak_id);
		return false;
	}

	const auto &streak = *user.GetStreak(streak_id);

	return IsActive(streak, user_id, today);
}

bool StreakDatabase::IsActive(const Streak& streak, std::int64_t user_id, Date today) const{
	auto &user = GetUserNoAutoFreeze(user_id, today);

	if(streak.Status == StreakStatus::Removed)
		return false;

	if(!streak.IsChallenge())
		return streak.Count(today, user.GetFreezes());
	
	std::int64_t challenge_id = streak.Challenge.value();

	if(!m_Challenges.count(challenge_id)) {
		LogModel(Error, "Streak has invalid challenge id '%'", challenge_id);
		return false;
	}

	const Challenge &challenge = m_Challenges.at(challenge_id);

	if(challenge.GetStatus(today) != ChallengeStatus::Running)
		return false;

	assert(!streak.IsFreezable());

	return streak.Count(today, {}) || challenge.GetStart() == today;
}

bool StreakDatabase::AreActiveCommited(std::int64_t user_id, Date today)const{
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	auto challenges = ChallengesWithoutIds(user_id);

	if(!ActiveStreaks(user_id, today).size())
		return false;

	for (auto streak_id : user.StreakIdsRange()) {
		auto streak = user.GetStreak(streak_id);

		if(IsActive(*streak, user_id, today) && !streak->IsCommitedAt(today))
			return false;
	}

	return true;
}

bool StreakDatabase::AreActiveFreezedOrCommited(std::int64_t user_id, Date today) const{
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	auto challenges = ChallengesWithoutIds(user_id);

	if(!ActiveStreaks(user_id, today).size())
		return false;

	for (auto streak_id : user.StreakIdsRange()) {
		auto streak = user.GetStreak(streak_id);

		if(!IsActive(*streak, user_id, today))
			continue;

		if(streak->ProtectionAt(today, user.GetFreezes()) == Protection::None)
			return false;
	}

	return true;
}

std::vector<Protection> StreakDatabase::ActiveHistory(std::int64_t user, Date start, Date end)const {
	std::vector<Protection> history;

	for (auto date : DateUtils::Range(start, end))
		history.push_back(ActiveProtection(user, date));

	return history;
}

std::vector<Protection> StreakDatabase::ActiveHistoryForToday(std::int64_t user_id, Date today)const {
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	auto first = user.FirstCommitEver();

	if(!first.has_value())
		return {};

	auto start = std::min(first.value(), today);

	return ActiveHistory(user_id, start, today);
}

std::int64_t StreakDatabase::ActiveStreak(std::int64_t user_id, Date today) const {
	std::int64_t streak = ActiveProtection(user_id, today) == Protection::Commit;
	
	date::year_month_day check_date = DateUtils::Yesterday(today);
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	auto start = user.FirstCommitEver().value_or(today);

	while (ActiveProtection(user_id, check_date) != Protection::None && check_date >= start) {
		streak += ActiveProtection(user_id, check_date) == Protection::Commit;
		check_date = DateUtils::Yesterday(check_date);
	}

	return streak;
}

std::vector<std::int64_t> StreakDatabase::ActiveStreaks(std::int64_t user_id, Date today) const{
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	
	std::vector<std::int64_t> result;

	for (std::int64_t streak_id: user.StreakIdsRange()) {
		if(!IsActive(user_id, streak_id, today))
			continue;	

		result.push_back(streak_id);
	}
	return result;

}

std::vector<std::string> StreakDatabase::ActiveStreaksDescriptions(std::int64_t user_id, Date today) const{
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	
	std::vector<std::string> result;

	for (std::int64_t streak_id: user.StreakIdsRange()) {
		if(!IsActive(user_id, streak_id, today))
			continue;	

		auto streak = user.GetStreak(streak_id);

		result.push_back(streak->Description);
	}
	return result;
}

std::vector<std::int64_t> StreakDatabase::ActivePendingStreaks(std::int64_t user_id, Date today) const{
	const auto &user = GetUserNoAutoFreeze(user_id, today);
	
	std::vector<std::int64_t> result;

	for (std::int64_t streak_id: user.StreakIdsRange()) {
		if(!IsActive(user_id, streak_id, today))
			continue;	

		auto streak = user.GetStreak(streak_id);

		if(streak->IsProtectedAt(today, user.GetFreezes()))
			continue;

		result.push_back(streak_id);
	}
	return result;

}

Protection StreakDatabase::ActiveProtection(std::int64_t user_id, Date today)const {
	const auto &user = GetUserNoAutoFreeze(user_id, today);

	if(!ActiveStreaks(user_id, today).size())
		return Protection::NothingToProtect;

	if(AreActiveCommited(user_id, today))
		return Protection::Commit;
	
	if(AreActiveFreezedOrCommited(user_id, today))
		return Protection::Freeze;

	return Protection::None;
}

std::vector<Payload<Streak, StreakPayload>> StreakDatabase::StreaksWithPayload(std::int64_t user_id, Date today) const{
	const auto &user = m_Users[user_id];

	std::vector<Payload<Streak, StreakPayload>> result;
	
	const auto &streaks = user.GetStreaks();
	for (auto i = 0; i<streaks.size(); i++){
		const auto &streak = streaks[i];

		if(streak.Challenge.has_value() && !CanCommitToChallenge(user_id, streak.Challenge.value(), today))
			continue;

		if(streak.Status == StreakStatus::Removed)
			continue;

		auto count = streak.Count(today, user.GetFreezes());

		StreakPayload payload;
		payload.Id = i;
		payload.History = streak.HistoryForToday(today, user.GetFreezes());
		payload.Start = streak.FirstCommitDate().value_or(today);
		payload.Count = count;
		payload.Required = count || streak.IsChallenge();
		payload.Freezable = streak.IsFreezable();

		Payload<Streak, StreakPayload> streak_with_payload;
		streak_with_payload.Model = streak;
		streak_with_payload.PayloadData = std::move(payload);
	
		result.emplace_back(std::move(streak_with_payload));
	}

	return result;
}

namespace Crypto{

static std::string GenerateToken(size_t length = 32) {
    static const std::string charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    std::default_random_engine rng(std::chrono::system_clock::now().time_since_epoch().count());
    std::uniform_int_distribution<> dist(0, charset.size() - 1);

    std::string token;
    for (size_t i = 0; i < length; ++i) {
        token += charset[dist(rng)];
    }

    return token;
}

}//namespace Utils::

std::string StreakDatabase::GetToken(std::int64_t user, bool force_recreate) const{
	if(m_Tokens.count(user) && !force_recreate)
		return m_Tokens.at(user);
	
	defer{ SaveTokensToFile(); };

	return (m_Tokens[user] = Crypto::GenerateToken());
}

std::int64_t StreakDatabase::UniqueChallengeId() const{
	// zero id is reserved for something, idk
	std::int64_t id = m_Challenges.size() + 1;
	
	while(m_Challenges.count(id))
		++id;
	
	return id;
}

std::int64_t StreakDatabase::AddChallenge(Challenge&& challenge){
	std::int64_t id = UniqueChallengeId();

	m_Challenges.emplace(id, std::move(challenge));
	
	return id;
}

bool StreakDatabase::JoinChallenge(std::int64_t user_id, std::int64_t challenge_id, Date today) {
	if (!m_Users.count(user_id)) {
		LogModel(Error, "JoinChallenge: User '%' does not exist", user_id);
		return false;
	}

	if (!m_Challenges.count(challenge_id)) {
		LogModel(Error, "JoinChallenge: Challenge '%' does not exist", challenge_id);
		return false;
	}

	auto &challenge = m_Challenges[challenge_id];
	auto &user = GetUserNoAutoFreeze(user_id, today);

	if (challenge.Has(user_id)) {
		LogModel(Error, "JoinChallenge: Can't join '%', user '%' is already in", challenge.GetName(), user_id);
		return false;
	}

	if (!challenge.CanJoin(today)) {
		LogModel(Error, "JoinChallenge: Can't join '%'", challenge.GetName());
		return false;
	}

	challenge.Add(user_id);

	for(const auto &todo: challenge.GetToDo())
		user.AddChallengeStreak(todo, challenge_id);

	return true;	
}

bool StreakDatabase::LeaveChallenge(std::int64_t user_id, std::int64_t challenge_id, Date today){
	if (!m_Users.count(user_id)) {
		LogModel(Error, "LeaveChallenge: User '%' does not exist", user_id);
		return false;
	}

	if (!m_Challenges.count(challenge_id)) {
		LogModel(Error, "LeaveChallenge: Challenge '%' does not exist", challenge_id);
		return false;
	}

	auto &challenge = m_Challenges[challenge_id];
	auto &user = GetUserNoAutoFreeze(user_id, today);

	if (!challenge.Has(user_id)) {
		LogModel(Error, "LeaveChallenge: Can't leave '%', user '%' is not in challenge", challenge.GetName(), user_id);
		return false;
	}
	
	challenge.Remove(user_id);
	user.RemoveChallengeStreaks(challenge_id);

	return true;
}

std::int64_t StreakDatabase::Count(std::int64_t user_id, std::int64_t challenge_id, Date today) const {
	if (!m_Users.count(user_id)) {
		LogModel(Error, "Count: User '%' does not exist", user_id);
		return false;
	}

	if (!m_Challenges.count(challenge_id)) {
		LogModel(Error, "Count: Challenge '%' does not exist", challenge_id);
		return false;
	}
	
	const auto &challenge = m_Challenges.at(challenge_id);
	const auto &user = m_Users.at(user_id);

	if(challenge.GetStatus(today) == ChallengeStatus::Pending)
		return 0;

	auto ProtectedHistoryRun = [&](const Streak &streak) {
		auto history = streak.History(challenge.GetStart(), today, user.GetFreezes());
		
		auto until_non_commited =  history | rx::until([](Protection prot){return prot != Protection::Commit; }) | rx::count();

		return until_non_commited;
	};

	//RX ranges is a disaster, how the hell you've fucked up rx::min function
	auto count = min(user.GetStreaks() | filter(&Streak::IsFromChallenge, challenge_id) | rx::transform(ProtectedHistoryRun));
	
	return count.value_or(0);
}

bool StreakDatabase::CommitedChallengeAt(std::int64_t user, std::int64_t challenge_id, Date today) const{
	if(!IsInChallenge(user, challenge_id))
		return false;
	
	const auto &challenge = m_Challenges.at(challenge_id);
	return Count(user, challenge_id, today) == challenge.DayOfChallenge(today) + 1;
}

bool StreakDatabase::HasLost(std::int64_t user_id, std::int64_t challenge_id, Date today) const {
	if (!m_Challenges.count(challenge_id)) {
		LogModel(Error, "HasLost: Challenge '%' does not exist", challenge_id);
		return false;
	}
	const auto &challenge = m_Challenges.at(challenge_id);

	if(challenge.GetStatus(today) == ChallengeStatus::Pending)
		return false;
	
	if(challenge.GetStatus(today) == ChallengeStatus::Finished)
		return Count(user_id, challenge_id, today) != challenge.GetDuration();

	std::int64_t min_accepted_count = challenge.DayOfChallenge(today);

	return Count(user_id, challenge_id, today) < min_accepted_count;
}

bool StreakDatabase::CanCommitToChallenge(std::int64_t user, std::int64_t challenge_id, Date today) const{
	if(!IsInChallenge(user, challenge_id))
		return false;

	const auto &challenge = GetChallenge(challenge_id);

	if(challenge.GetStatus(today) != ChallengeStatus::Running)
		return false;

	if(HasLost(user, challenge_id, today))
		return false;

	return true;
}

std::vector<Payload<Challenge, ChallengePayload>> StreakDatabase::ChallengesWithPayload(std::int64_t user, Date today)const{
	std::vector<Payload<Challenge, ChallengePayload>> result;
	
	for (const auto& [challenge_id, challenge]: m_Challenges) {
		if(!challenge.Has(user))
			continue;

		ChallengePayload payload;
		payload.Id = challenge_id;
		payload.HasLost = HasLost(user, challenge_id, today);
		payload.Count = Count(user, challenge_id, today);
		payload.DayOfChallenge = challenge.DayOfChallenge(today);
		payload.CanJoin = challenge.CanJoin(today);
		payload.Status = challenge.GetStatus(today);

		result.emplace_back(challenge, std::move(payload));
	}

	return result;
}

std::vector<Challenge> StreakDatabase::ChallengesWithoutIds(std::int64_t user) const{
	std::vector<Challenge> result;
	
	for (const auto& [challenge_id, challenge]: m_Challenges) {
		if(!challenge.Has(user))
			continue;

		result.push_back(challenge);
	}

	return result;

}

bool StreakDatabase::IsInChallenge(std::int64_t user, std::int64_t challenge) const{
	if(!m_Users.count(user) || !m_Challenges.count(challenge))
		return false;

	return m_Challenges.at(challenge).Has(user);
}

Challenge& StreakDatabase::GetChallenge(std::int64_t challenge) const{
	assert(m_Challenges.count(challenge));

	return m_Challenges[challenge];
}

std::vector<ChallengeParticipant> StreakDatabase::GetChallengeParticipant(std::int64_t challenge, Date today, std::function<std::string(std::int64_t)> fetch_fullname, std::function<std::string(std::int64_t)> fetch_username) const{
	if (!m_Challenges.count(challenge)) {
		LogModel(Error, "GetChallengeParticipant: challenge '%' does not exist", challenge);
		return {};
	}

	std::vector<ChallengeParticipant> result;

	for (std::int64_t id: m_Challenges[challenge].GetParticipants()) {
		if(!m_Users.count(id))
			continue;
		//XXX maybe autofreeze?

		ChallengeParticipant participant;
		participant.Id = id;
		participant.FullName = fetch_fullname(id);
		participant.Username = fetch_username(id);
		participant.Count = Count(id, challenge, today);
		participant.HasLost = HasLost(id, challenge, today);

		result.emplace_back(std::move(participant));
	}

	return result;
}

std::vector<std::int64_t> StreakDatabase::GetUsers() const{
	std::vector<std::int64_t> users;

	for (const auto& [user, _]: m_Users)
		users.push_back(user);

	return users;
}

void StreakDatabase::SaveTokensToFile() const{
	WriteEntireFile(m_TokensFilepath, nlohmann::json(m_Tokens).dump());
}

void StreakDatabase::SaveUserToFile(std::int64_t user)const{
	auto path = std::filesystem::path(m_UsersFolder) / Format("%.json", user);

	WriteEntireFile(path.string(), nlohmann::json(m_Users[user]).dump());
}

void StreakDatabase::SaveChallengeToFile(std::int64_t challenge)const{
	auto path = std::filesystem::path(m_ChallengesFolder) / Format("%.json", challenge);

	WriteEntireFile(path.string(), nlohmann::json(m_Challenges[challenge]).dump());
}

