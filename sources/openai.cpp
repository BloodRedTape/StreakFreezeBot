#include "openai.hpp"
#include <bsl/format.hpp>
#include <bsl/log.hpp>
#include <nlohmann/json.hpp>
#include <sstream>
#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>

DEFINE_LOG_CATEGORY(OpenAI)

using json = nlohmann::json;

void to_json(json& j, const OpenAI::Role& role) {
    switch(role) {
        case OpenAI::Role::System:
            j = "system";
            break;
        case OpenAI::Role::User:
            j = "user";
            break;
        case OpenAI::Role::Assistant:
            j = "assistant";
            break;
        default:
            j = "none";
            break;
    }
}

void to_json(json& j, const OpenAI::Message& message) {
    j = json{{"role", message.Role}, {"content", message.Content}};
}

const char* OpenAI::ToString(OpenAI::Role role) {
    switch(role){
        case OpenAI::Role::System:
            return "System";
            break;
        case OpenAI::Role::User:
            return "User";
            break;
        case OpenAI::Role::Assistant:
            return "Assistant";
    }
    return "";
}

std::optional<std::string> OpenAI::Complete(const std::string &key, std::vector<Message> messages, float temperature, const std::string &model)
{
    httplib::Client client(ApiLink);

    auto responce = client.Post(
        "/v1/chat/completions", 
        {{"Authorization", "Bearer " + key}}, 
        Format(R"({"model": "%", "messages": %, "temperature": %})", model, json(messages).dump(), temperature), 
        "application/json"
    );

    if(!responce)
        return (LogOpenAI(Error, "Request failed with %", httplib::to_string(responce.error())), std::nullopt);

    if(responce->status != httplib::StatusCode::OK_200)
        return (LogOpenAI(Error, "Request failed with status %", responce->status), std::nullopt);

    json body = json::parse(responce->body, nullptr, false, false);

    try{
        return body["choices"].front()["message"]["content"];
    }catch (const std::exception& e) {
        LogOpenAI(Error, "can't parse reponse: %\nCaught exception: %", responce->body, e.what());
    }
    return std::nullopt;
}