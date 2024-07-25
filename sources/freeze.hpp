#pragma once

#include "time.hpp"
#include <optional>
#include <nlohmann/json.hpp>

struct StreakFreeze {
	Date EarnedAt;
	Date ExpireAt;
	std::optional<Date> UsedAt;
    bool Removed = false;
    std::string Reason;

	bool CanBeUsedAt(Date date)const;

    void UseAt(Date date);
};

inline bool operator<(const StreakFreeze& lhs, const StreakFreeze& rhs) {
	return lhs.ExpireAt < rhs.ExpireAt;
}

inline void to_json(nlohmann::json& j, const StreakFreeze& sf) {
    j = nlohmann::json{
        {"EarnedAt", sf.EarnedAt},
        {"ExpireAt", sf.ExpireAt},
        {"Removed",  sf.Removed},
        {"Reason",   sf.Reason}
    };

    if(sf.UsedAt.has_value())
        j["UsedAt"] = sf.UsedAt.value();
}

inline void from_json(const nlohmann::json& j, StreakFreeze& sf) {
    j["EarnedAt"].get_to(sf.EarnedAt);
    j["ExpireAt"].get_to(sf.ExpireAt);
    j["Removed" ].get_to(sf.Removed);
    j["Reason"  ].get_to(sf.Reason);

    if (j.contains("UsedAt") && !j.at("UsedAt").is_null()) {
        sf.UsedAt = j["UsedAt"];
    } else {
        sf.UsedAt.reset();
    }
}
