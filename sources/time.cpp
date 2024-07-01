#include "time.hpp"
#include <iostream>
#include <ctime>

namespace DateUtils{

Date NowImpl() {
    return std::chrono::floor<date::days>(std::chrono::system_clock::now());
}

#if WITH_ADVANCE_DATE
Date s_Now = NowImpl();
#endif

Date Now() {
#if WITH_ADVANCE_DATE
    return s_Now; 
#else
    return Date_NowImpl();
#endif
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
