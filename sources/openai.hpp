#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>

class OpenAI {
	static constexpr const char *ApiLink = "https://api.openai.com";
public:
	static constexpr const char *DefaultModel = "gpt-4-turbo";
public:
	enum class Role {
		System,
		User,
		Assistant
	};

	static const char *ToString(Role role);

	struct Message {
		enum Role Role;	
		std::string Content;
	};
public:
	static std::string Complete(const std::string& key, std::vector<Message> message, const std::string &model = DefaultModel);
};
