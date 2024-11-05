#pragma once

#include <chrono>
#include <vector>
#include <functional>
#include <nlohmann/json.hpp>
#include <date/date.h>

using Date = date::year_month_day;

namespace DateUtils{
    extern Date Now();

    inline Date Tomorrow(Date of) {
	    return date::sys_days(of) + date::days(1);
    }

    inline Date Tomorrow() {
        return Tomorrow(Now());
    }

    inline Date Yesterday(Date of) {
	    return date::sys_days(of) - date::days(1);
    }

    inline Date Yesterday() {
        return Yesterday(Now());
    }

    std::int64_t DaysDiff(Date first, Date second);

    extern std::vector<Date> Range(Date from, Date to);

    namespace Debug{
        extern void AdvanceCurrentDate();
        extern std::function<void()> PreDateAdvanced;
        extern std::function<void()> PostDateAdvanced;
    }
}

namespace nlohmann {
    template <>
    struct adl_serializer<date::year_month_day> {
        static void to_json(nlohmann::json& j, const date::year_month_day& date) {
            j = nlohmann::json::array({(unsigned int)date.day(), (unsigned int)date.month(), (int)date.year()});
        }

        static void from_json(const nlohmann::json& j, date::year_month_day& date) {
            int year = 0, month = 0, day = 0;
            j.at(0).get_to(day);
            j.at(1).get_to(month);
            j.at(2).get_to(year);
            date = date::year_month_day(date::year(year), date::month(month), date::day(day));
        }
    };
}
