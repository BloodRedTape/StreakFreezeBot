#pragma once

#include "http.hpp"
#include <INIReader.h>
#include <tgbot/Bot.h>

class TgBridge : public HttpServer {
	using Super = HttpServer;
	using ThisClass = TgBridge;
private:
	static constexpr const char *SectionName = "TgBridge";
private:
	INIReader m_Config;
	std::string m_Hostname;
	int m_Port;

	std::string m_BotToken;
	TgBot::Bot m_Bot;

	std::unordered_map<std::string, std::string> m_TelegramCache;
	std::unordered_map<std::string, std::string> m_PlaceholdersCache;
public:	
	TgBridge(const INIReader &config);

	void Run();

	void GetTg(const httplib::Request &req, httplib::Response &resp);

	void GetPlaceholder(const httplib::Request &req, httplib::Response &resp);

	const std::string &GetOrDownloadTgFile(const std::string &path);

	const std::string &GetOrDownloadPlaceholder(const std::string &first_name, const std::string &last_name);

};