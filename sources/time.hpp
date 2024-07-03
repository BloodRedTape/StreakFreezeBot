#pragma once

#include <chrono>
#include <vector>
#include <nlohmann/json.hpp>
#include <date/date.h>

using Date = date::year_month_day;

namespace DateUtils{
    extern Date Now();

    extern std::vector<Date> Range(Date from, Date to);

    namespace Debug{
        extern void AdvanceCurrentDate();
    }
}

inline void to_json(nlohmann::json& j, const date::year_month_day& date) {
    j = nlohmann::json::array({(unsigned int)date.day(), (unsigned int)date.month(), (int)date.year()});
}

inline void from_json(const nlohmann::json& j, date::year_month_day& date) {
    int year = 0, month = 0, day = 0;
    j.at(0).get_to(day);
    j.at(1).get_to(month);
    j.at(2).get_to(year);
    date = date::year_month_day(date::year(year), date::month(month), date::day(day));
}
