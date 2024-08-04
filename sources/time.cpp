#include "time.hpp"
#include <iostream>
#include <ctime>

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

        // Convert tm to time_point<system_clock, days>
        auto midnight = std::chrono::system_clock::from_time_t(std::mktime(&local_tm));
        return std::chrono::floor<std::chrono::days>(midnight);
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


    std::vector<Date> Range(Date from, Date to){
        assert(from <= to);

        std::vector<Date> range;

        for (auto date = (date::sys_days)from; date != (date::sys_days)to; date += date::days(1)) {
            range.push_back(date);
        }

        range.push_back(to);

        return range;
    }

}
