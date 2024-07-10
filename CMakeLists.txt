cmake_minimum_required (VERSION 3.8)

cmake_policy(SET CMP0091 NEW)

project(StreakFreezeBot)

add_library(inih STATIC "libs/inih/ini.c" "libs/inih/cpp/INIReader.cpp")
target_include_directories(inih PUBLIC "libs/inih" PUBLIC "libs/inih/cpp")

add_subdirectory(libs/bsl)
set(HTTPLIB_USE_ZLIB_IF_AVAILABLE OFF)
add_subdirectory(libs/cpp-httplib)
add_subdirectory(libs/json)
add_subdirectory(libs/tgbot-cpp)
add_subdirectory(libs/date)


add_executable(StreakFreezeBot
	"./sources/main.cpp"
	"./sources/simple_bot.cpp"
	"./sources/time.cpp"
	"./sources/bot.cpp" 
	"./sources/model.cpp"
	"./sources/logger.cpp"
 "sources/server.cpp")

target_link_libraries(StreakFreezeBot
	bsl
	inih
	nlohmann_json
	httplib
	TgBot
	date
)

if(CMAKE_WITH_CONAN)
	find_package(openssl)

	target_link_libraries(StreakFreezeBot openssl::openssl)
else()
	target_link_libraries(StreakFreezeBot ssl)
endif()

target_compile_features(StreakFreezeBot PUBLIC cxx_std_17)

if(WITH_DEBUG_COMMANDS)
	target_compile_definitions(StreakFreezeBot PRIVATE WITH_ADVANCE_DATE=1)
	target_compile_definitions(StreakFreezeBot PRIVATE WITH_DAY_ALMOST_OVER=1)
endif()

