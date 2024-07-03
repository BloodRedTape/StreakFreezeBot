#include <bsl/log.hpp>
#include <bsl/file.hpp>
#include <httplib.h>
#include <INIReader.h>
#include "bot.hpp"

void ServerMain(const INIReader &config) {
	static const char *SectionName = "MiniAppHttpServer";
	using namespace httplib;

	Server server;
	
	std::string WebPagePath = config.Get(SectionName, "WebAppHtmlPath", "mini_app/index.html");

	server.Get("/", [&](const Request &req, Response &resp) {
		std::string WebPage = ReadEntireFile(WebPagePath);
        resp.status = 200;
		resp.set_content(WebPage, "text/html");
	});

	server.Get("/history/:user", [&](const Request& req, Response& resp) {
		StreakDatabase db(config);

		auto user_id = req.path_params.at("user");
		//auto chat_id = req.path_params.at("chat");

		if (!user_id.size()) {
			resp.status = 404;
			return;
		}

		std::int64_t user = std::atoll(user_id.c_str());

		auto history = db.History(user);

		resp.status = 200;
		resp.set_content(nlohmann::json(history).dump(), "application/json");
	});

	server.listen(
		config.Get(SectionName, "Hostname", "localhost"),
		config.GetInteger(SectionName, "Port", 2024)
	);
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