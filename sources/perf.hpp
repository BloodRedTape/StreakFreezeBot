#pragma once

#include <chrono>
#include <string>

class ScopedTimer {
public:
    // Constructor that takes a label for the timer
    ScopedTimer(const std::string& label = "", int level = 0)
        : label_(label), start_(std::chrono::high_resolution_clock::now()), level_(level) {
    }

    // Destructor will calculate the elapsed time
    ~ScopedTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> elapsed = end - start_;

		for(int i = 0; i<level_; i++)
			std::cout << '\t';
        std::cout << label_ << ": " 
                  << elapsed.count() << " seconds" << std::endl;
    }

private:
    std::string label_;
	int level_;
    std::chrono::high_resolution_clock::time_point start_;
};

#ifdef WITH_PROFILE_SCOPE
#define PROFILE_SCOPE(name, level) ScopedTimer __SomeTimer##__LINE__##(name, level)
#else
#define PROFILE_SCOPE(name, level)
#endif
