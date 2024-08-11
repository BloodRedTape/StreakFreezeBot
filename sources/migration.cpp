#include "migration.hpp"
#include "todo.hpp"

struct UserV1 {
	std::vector<StreakFreeze> Freezes;
    std::vector<Date> Commits;
    std::int64_t MaxFreezes = 2;
    std::vector<std::int64_t> Friends;

    std::vector<ToDoDescription> Persistent;
    ToDoCompletion PersistentCompletion;

    NLOHMANN_DEFINE_TYPE_INTRUSIVE(UserV1, Freezes, Commits, MaxFreezes, Friends, Persistent, PersistentCompletion)
};

template<>
nlohmann::json Migrate<User>(nlohmann::json old) {
    UserV1 old_user = old;

	std::vector<StreakFreeze> freezes = old_user.Freezes;
    std::int64_t max_freezes = old_user.MaxFreezes;
    std::vector<std::int64_t> friends = old_user.Friends;
    std::vector<Streak> streaks;
    
    if(old_user.Persistent.size()){
        for (const std::string& description : old_user.Persistent.front().List) {
            streaks.push_back({
                description,
                old_user.Commits
            });
        }
    }

    return nlohmann::json(
        User(
            std::move(freezes), 
            max_freezes, 
            std::move(friends), 
            std::move(streaks)
        )
    );
}
