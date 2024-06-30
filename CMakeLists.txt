project(StreakFreezeBot)


add_library(inih STATIC "libs/inih/ini.c" "libs/inih/cpp/INIReader.cpp")
target_include_directories(inih PUBLIC "libs/inih" PUBLIC "libs/inih/cpp")

add_subdirectory(libs/bsl)
add_subdirectory(libs/cpp-httplib)
add_subdirectory(libs/json)

add_executable(StreakFreezeBot
	"./sources/main.cpp"
)

target_link_libraries(StreakFreezeBot
	bsl
	inih
	nlohmann_json
	httplib
)