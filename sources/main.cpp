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

	StreakBot bot(config);

	bot.Log("Started");

	try{
		while (true) {
			bot.LongPollIteration();
			bot.Tick();
		}
	} catch (const std::exception& e) {
		bot.Log("Crashed: %", e.what());
	}
	return 0;
}