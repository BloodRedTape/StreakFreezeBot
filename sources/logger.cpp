#include "logger.hpp"
#include "bsl/file.hpp"
#include <tgbot/net/TgLongPoll.h>

FileLogger::FileLogger(const INIReader& config):
	m_LogFile(
		config.Get(SectionName, "Filepath", DefaultLogPath),
		std::ios::out | std::ios::app
	)
{}

bool FileLogger::IsValid() const {
	return m_LogFile.is_open();
}

void FileLogger::Log(const std::string& message) {
    m_LogFile << "[" << CurrentDataAndTime() << "]: " << message << std::endl;
}

RedirectingLogger::RedirectingLogger(std::initializer_list<Logger*> loggers):
	m_Loggers(loggers)
{}

bool RedirectingLogger::IsValid() const {
	return true;
}

void RedirectingLogger::Log(const std::string& message) {
	for (Logger* logger : m_Loggers) {
		logger->Log(message);
	}
}

bool ConsoleLogger::IsValid() const {
	return true;
}

void ConsoleLogger::Log(const std::string& message) {
	Println("%", message);
}

TelegramLogger::TelegramLogger(const INIReader& config):
	m_LogChatId(
		config.GetInteger64(SectionName, "LogChatId", 0)
	),
	m_Bot(
		config.GetString(SectionName, "Token", "")
	),
	m_DebugBotName(
		config.GetString(SectionName, "DebugName", "UnknownBotName")
	),
	m_IsEnabled(
		config.GetBoolean(SectionName, "IsEnabled", false)
	)
{
	try {
		m_LogChat = m_Bot.getApi().getChat(m_LogChatId);
	} catch (const std::exception &exception) {
		Println("Can't get chat for chat_id % with token %, reason: %", m_LogChatId, m_Bot.getToken(), exception.what());
	}
}

bool TelegramLogger::IsValid() const {
	return (bool)m_LogChat;
}

void TelegramLogger::Log(const std::string& message) {
	if (!m_IsEnabled) {
		return;
	}

	try{
		m_Bot.getApi().sendMessage(m_LogChat->id, Format("[%]: %", m_DebugBotName, message));
	} catch (const std::exception &exception) {
		Println("Can't log for chat_id % with token %, reason: %", m_LogChatId, m_Bot.getToken(), exception.what());
	}
}


