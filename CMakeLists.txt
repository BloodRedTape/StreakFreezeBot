cmake_minimum_required (VERSION 3.8)

cmake_policy(SET CMP0091 NEW)

project(StreakFreezeBot)

set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_STANDARD 20)

add_library(inih STATIC "libs/inih/ini.c" "libs/inih/cpp/INIReader.cpp")
target_include_directories(inih PUBLIC "libs/inih" PUBLIC "libs/inih/cpp")

set(BSL_WITH_EXTERNAL_LOG_FUNCTION ON)
add_subdirectory(libs/bsl)
set(HTTPLIB_USE_ZLIB_IF_AVAILABLE OFF)
add_subdirectory(libs/cpp-httplib)
add_subdirectory(libs/json)
add_subdirectory(libs/tgbot-cpp)
set(COMPILE_WITH_C_LOCALE ON)
add_subdirectory(libs/date)
add_subdirectory(libs/hmac_sha256)


add_executable(StreakFreezeBot
	"./sources/main.cpp"
	"./sources/simple_bot.cpp"
	"./sources/time.cpp"
	"./sources/bot.cpp" 
	"./sources/model.cpp"
	"./sources/logger.cpp"
	"sources/server.cpp" 
	"sources/user.cpp" 
	"sources/freeze.cpp"
	"sources/todo.cpp"
	"sources/timer_client.cpp"
	"sources/openai.cpp"
	"sources/streak.cpp" 
)

target_link_libraries(StreakFreezeBot
	PUBLIC bsl
	PUBLIC inih
	PUBLIC nlohmann_json
	PUBLIC httplib
	PUBLIC TgBot
	PUBLIC date
	PUBLIC hmac_sha256
)

if(CMAKE_WITH_CONAN)
	find_package(OpenSSL)
	target_link_libraries(StreakFreezeBot PUBLIC openssl::openssl)
else()
	target_link_libraries(StreakFreezeBot PUBLIC ssl PUBLIC crypto)
endif()


if(WITH_DEBUG_COMMANDS)
	target_compile_definitions(StreakFreezeBot PRIVATE WITH_ADVANCE_DATE=1)
	target_compile_definitions(StreakFreezeBot PRIVATE WITH_DAY_ALMOST_OVER=1)
endif()

