#pragma once

#include <fstream>
#include <tgbot/Bot.h>
#include <bsl/format.hpp>
#include "INIReader.h"

class Logger {
public:
	virtual bool IsValid()const = 0;

	virtual void Log(const std::string &message) = 0;

	template<typename ...ArgsType>
	void Log(const char* fmt, const ArgsType&...args) {
		Log(Format(fmt, args...));
	}
};

class RedirectingLogger : public Logger {
	std::vector<Logger *> m_Loggers;
public:
	RedirectingLogger(std::initializer_list<Logger *> loggers);

	bool IsValid()const override;

	void Log(const std::string &message)override;
};

class FileLogger : public Logger{
	static constexpr const char *SectionName = "FileLogger";
    static constexpr const char *DefaultLogPath = "Bot.log";
private:
	std::fstream m_LogFile;
public:
	FileLogger(const INIReader &config);

	bool IsValid()const override;

	void Log(const std::string &message)override;
};

class ConsoleLogger : public Logger {
public:
	bool IsValid()const override;

	void Log(const std::string &message)override;
};

class TelegramLogger : public Logger{
	static constexpr const char *SectionName = "TelegramLogger";
	
	int64_t m_LogChatId;
	TgBot::Bot m_Bot;
	TgBot::Chat::Ptr m_LogChat;
	std::string m_DebugBotName;
	bool m_IsEnabled = false;
public:
	TelegramLogger(const INIReader &config);

	bool IsValid()const override;

	void Log(const std::string &message)override;
};

class HybridLogger : public RedirectingLogger {
	TelegramLogger m_Telegram;
	ConsoleLogger m_Console;
public:	
	HybridLogger(const INIReader &config);
};