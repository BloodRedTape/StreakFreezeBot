#include <bsl/log.hpp>
#include <bsl/file.hpp>
#include <INIReader.h>
#include <mutex>
#include "server.hpp"
#include "timer_client.hpp"
#include "bot.hpp"

void ServerMain(const INIReader &config) {
	HttpApiServer(config).Run();
}

void TimerMain(const INIReader &config) {
	TimerClient(config).Run();
}

int main(int argc, char *argv[]) {

	std::string config_name = (argc == 2 ? argv[1] : "Config.ini");
	
	auto content = ReadEntireFile(config_name);
	INIReader config(content.data(), content.size());

	if(int error = config.ParseError()){
		Println("Can't parse config file: %, %", config_name, error);
		return EXIT_FAILURE;
	}

	std::thread server_thread(ServerMain, std::ref(config));
	std::thread timer_thread(TimerMain, std::ref(config));

	StreakBot bot(config);

	bot.Log("Started: %", BSL_WITH_EXTERNAL_LOG_FUNCTION);

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