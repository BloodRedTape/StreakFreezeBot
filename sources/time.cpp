#include "time.hpp"
#include <iostream>
#include <ctime>

namespace DateUtils{

    static Date NowImpl() {
        return std::chrono::floor<date::days>(std::chrono::system_clock::now());
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
