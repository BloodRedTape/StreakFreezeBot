#pragma once

#include <string>
#include <vector>
#include "json.hpp"
#include "time.hpp"

struct ToDoDescription {
	std::optional<date::year_month_day> Started;
	std::vector<std::string> List;	

	NLOHMANN_DEFINE_TYPE_INTRUSIVE(ToDoDescription, Started, List)

	bool IsPending()const{ return !Started.has_value(); }

	bool IsRunning()const{ return !IsPending(); }

	void Start(Date date) {
		assert(!Started.has_value());
		Started = date;
	}
};

struct ToDoCompletion {
	date::year_month_day Date;
	std::vector<std::int8_t> Checks;

	NLOHMANN_DEFINE_TYPE_INTRUSIVE(ToDoCompletion, Date, Checks)

	ToDoCompletion(date::year_month_day date = {}) :
		Date(date)
	{}

	void Set(std::int8_t index, bool value);

	bool IsComplete(const ToDoDescription &desc)const;

};
