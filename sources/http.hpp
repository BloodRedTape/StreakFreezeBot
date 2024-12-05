#pragma once

#define CPPHTTPLIB_OPENSSL_SUPPORT 1
#include <httplib.h>
#include <optional>
#include <string>
#include <nlohmann/json.hpp>
#include <bsl/log.hpp>

DEFINE_LOG_CATEGORY(Http)

inline httplib::Client MakeSecureClient(const std::string& endpoint) {
	return httplib::Client(endpoint);
}

inline std::optional<std::string> HttpGet(const std::string& endpoint, const std::string &path, httplib::Headers headers = {}) {
    httplib::Client client = MakeSecureClient(endpoint);

	auto resp = client.Get(path, headers);

	if (!resp || resp.error() != httplib::Error::Success){
		LogHttp(Error, "GET Request to % failed with internal error %", endpoint + path, httplib::to_string(resp.error()));
		return std::nullopt;
	}

	if (resp->status != httplib::StatusCode::OK_200){
		LogHttp(Error, "GET Request to % failed with http status %", endpoint + path, resp->status);
		return std::nullopt;
	}

	return resp->body;
}

inline nlohmann::json HttpGetJson(const std::string& endpoint, const std::string &path, httplib::Headers headers = {}) {
	auto res = HttpGet(endpoint, path, headers);

	if(!res.has_value())
		return {};

	return nlohmann::json::parse(res.value(), nullptr, false, false);
}

inline std::optional<std::string> HttpPost(const std::string& endpoint, const std::string &path, httplib::Headers headers = {}, const std::string &content = {}, const std::string &content_type = "text/plain") {
    httplib::Client client = MakeSecureClient(endpoint);

	auto resp = content.size() ? client.Post(path, headers, content, content_type) : client.Post(path, headers);

	if (!resp || resp.error() != httplib::Error::Success){
		LogHttp(Error, "POST Request to % failed with internal error %", endpoint + path, httplib::to_string(resp.error()));
		return std::nullopt;
	}

	if (resp->status != httplib::StatusCode::OK_200){
		LogHttp(Error, "POST Request to % failed with http status %", endpoint + path, resp->status);
		return std::nullopt;
	}

	return resp->body;
}

inline nlohmann::json HttpPostJson(const std::string& endpoint, const std::string &path) {
	auto res = HttpPost(endpoint, path);

	if(!res.has_value())
		return {};

	return nlohmann::json::parse(res.value(), nullptr, false, false);
}

template<typename T>
std::optional<T> GetJsonProperty(const std::string &json_string, const std::string &property) {
	auto json = nlohmann::json::parse(json_string, nullptr, false, false);

	if(!json.count(property))
		return std::nullopt;

	return json[property].get<T>();
}

template<typename T>
std::optional<T> GetJsonObject(const std::string& json_string) {
	try {
		T object = nlohmann::json::parse(json_string);

		return object;
	} catch (...) {
		return std::nullopt;
	}
}

template<typename T>
T GetJsonPropertyOr(const std::string &json_string, const std::string &property, T value) {
	return GetJsonProperty<T>(json_string, property).value_or(value);
}

class HttpServer : public httplib::Server {
	using Super = httplib::Server;
public:

	template<typename ServerClass>
	HttpServer& Get(const std::string& pattern, ServerClass *object, void (ServerClass::*handler)(const httplib::Request &, httplib::Response &)){
		Super::Get(pattern, std::bind(handler, object, std::placeholders::_1, std::placeholders::_2));
		return *this;
	}

	template<typename ServerClass>
	HttpServer& Get(const std::string& pattern, const ServerClass *object, void (ServerClass::*handler)(const httplib::Request &, httplib::Response &)const){
		Super::Get(pattern, std::bind(handler, object, std::placeholders::_1, std::placeholders::_2));
		return *this;
	}

	template<typename ServerClass>
	HttpServer& Post(const std::string& pattern, ServerClass *object, void (ServerClass::*handler)(const httplib::Request &, httplib::Response &)){
		Super::Post(pattern, Super::Handler(std::bind(handler, object, std::placeholders::_1, std::placeholders::_2)));
		return *this;
	}

	template<typename ServerClass>
	HttpServer& Post(const std::string& pattern, const ServerClass *object, void (ServerClass::*handler)(const httplib::Request &, httplib::Response &)const){
		Super::Post(pattern, std::bind(handler, object, std::placeholders::_1, std::placeholders::_2));
		return *this;
	}

	std::optional<std::int64_t> GetIdParam(const httplib::Request& req, const std::string &name)const {
		if (!req.path_params.count(name))
			return std::nullopt;

		const std::string &user_id = req.path_params.at(name);
		errno = 0;
		std::int64_t id = std::atoll(user_id.c_str());
		if(errno)
			return std::nullopt;
	
		return id;
	}

	std::optional<std::string> GetParam(const httplib::Request& req, const std::string& name)const {
		if (!req.path_params.count(name))
			return std::nullopt;

		return req.path_params.at(name);
	}
};