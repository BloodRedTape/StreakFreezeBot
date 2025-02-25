#include "time.hpp"
#include <iostream>
#include <ctime>
#include <date/tz.h>

namespace DateUtils{

    static Date NowImpl() {
        auto now = std::chrono::system_clock::now();
        auto time_t_now = std::chrono::system_clock::to_time_t(now);

        // Use localtime or localtime_s to handle timezones
        std::tm local_tm;
#ifdef _WIN32
        localtime_s(&local_tm, &time_t_now);
#else
        localtime_r(&time_t_now, &local_tm);
#endif
        int year = local_tm.tm_year + 1900;  // tm_year is years since 1900
        unsigned month = local_tm.tm_mon + 1; // tm_mon is months since January (0-11)
        unsigned day = local_tm.tm_mday;

        // Create a year_month_day object
        date::year_month_day date(date::year{year}, date::month{month}, date::day{day});

        return date;
    }

#if WITH_ADVANCE_DATE
    static Date s_Now = NowImpl();
#endif

    Date Now() {
#if WITH_ADVANCE_DATE
        return s_Now; 
#else
        return DateUtils::NowImpl();
#endif
    }

    namespace Debug{
        std::function<void()> PreDateAdvanced;
        std::function<void()> PostDateAdvanced;

        void AdvanceCurrentDate(){
#if WITH_ADVANCE_DATE
            if(PreDateAdvanced)
                PreDateAdvanced();

	        DateUtils::s_Now = (date::sys_days)DateUtils::s_Now + date::days(1);

            if(PostDateAdvanced)
                PostDateAdvanced();
#endif
        }
    }


    std::int64_t DaysDiff(Date first, Date second){
        return (date::sys_days(first) - date::sys_days(second)).count();
    }

    std::vector<Date> Range(Date from, Date to){
        assert(from <= to);

        std::vector<Date> range;
        range.reserve(DaysDiff(to, from));

        for (auto date = (date::sys_days)from; date != (date::sys_days)to; date += date::days(1)) {
            range.push_back(date);
        }

        range.push_back(to);

        return range;
    }

}
