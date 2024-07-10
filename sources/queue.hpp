#pragma once

#include <string>
#include <vector>
#include <functional>
#include <unordered_map>
#include <bsl/log.hpp>

struct Message {
	std::int64_t User;
	std::string Type;
	std::string Data;
};

class MessageQueue {
public:
	virtual void Post(std::int64_t user, const std::string &type, const std::string &data = "") = 0;

	virtual std::vector<Message> Collect() = 0;
};

class MessageQueueDispatcher {
	using Handler = std::function<void(std::int64_t, const std::string &data)>;
private:
	std::unordered_map<std::string, Handler> m_Handlers;
public:
	void On(const std::string& type, Handler handler) {
		m_Handlers[type] = handler;
	}

	void Dispatch(const std::vector<Message>& messages) {
		for (const auto& message : messages) {
			Log(Display, "Dispatched: %", message.Type);
			auto &handler = m_Handlers[message.Type];

			if(handler)
				handler(message.User, message.Data);
		}
	}

	void Dispatch(MessageQueue &queue) {
		Dispatch(queue.Collect());
	}
};