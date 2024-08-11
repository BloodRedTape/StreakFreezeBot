#pragma once

#include "nlohmann/json.hpp"
#include "user.hpp"

template<typename Type>
nlohmann::json Migrate(nlohmann::json old) {
	return old;
}

template<>
nlohmann::json Migrate<User>(nlohmann::json old);

template<typename Type>
Type MigrateIfNeeded(nlohmann::json json) {
	try {
		return json;
	}catch (...) {
		return Migrate<Type>(json);
	}
}
