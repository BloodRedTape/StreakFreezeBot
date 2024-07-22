#pragma once

#ifndef CPPHTTPLIB_OPENSSL_SUPPORT
#define CPPHTTPLIB_OPENSSL_SUPPORT
#endif
#include <httplib.h>
#include <optional>
#include <string>
#include <nlohmann/json.hpp>

inline std::optional<std::string> HttpGet(const std::string& endpoint, const std::string &path, httplib::Headers headers = {}) {
    httplib::Client client(endpoint);

	auto resp = client.Get(path, headers);

	if (!resp || resp->status != 200)
		return std::nullopt;

	return resp->body;
}

inline nlohmann::json HttpGetJson(const std::string& endpoint, const std::string &path, httplib::Headers headers = {}) {
	auto res = HttpGet(endpoint, path, headers);

	if(!res.has_value())
		return {};

	return nlohmann::json::parse(res.value(), nullptr, false, false);
}

inline std::optional<std::string> HttpPost(const std::string& endpoint, const std::string &path) {
    httplib::Client client(endpoint);

	auto resp = client.Post(path);

	if (!resp || resp->status != 200)
		return std::nullopt;

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
T GetJsonPropertyOr(const std::string &json_string, const std::string &property, T value) {
	return GetJsonProperty<T>(json_string, property).value_or(value);
}