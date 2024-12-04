#pragma once

#include <nlohmann/json.hpp>
#include <optional>

NLOHMANN_JSON_NAMESPACE_BEGIN
template <typename T>
struct adl_serializer<std::optional<T>>{
    static void to_json(json& j, const std::optional<T>& opt){
        if (!opt.has_value()){
            j = nullptr;
        } else {
            j = *opt;
        }
    }

    static void from_json(const json& j, std::optional<T>& opt) {
        try {
            opt = j.get<T>();
        } catch (...) {
            opt = std::nullopt;
        }
    }
};
NLOHMANN_JSON_NAMESPACE_END

#ifndef UTF8
#define UTF8(text) ((const char *)u8##text)
#endif
