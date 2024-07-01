#include <bsl/log.hpp>
#include <bsl/file.hpp>
#include <httplib.h>
#include <INIReader.h>
#include "bot.hpp"

int main(int argc, char *argv[]) {

	std::string config_name = (argc == 2 ? argv[1] : "Config.ini");
	
	auto content = ReadEntireFile(config_name);
	INIReader config(content.data(), content.size());

	if(int error = config.ParseError()){
		Println("Can't parse config file: %, %", config_name, error);
		return EXIT_FAILURE;
	}

	StreakBot(config).LongPoll();
	return 0;
}