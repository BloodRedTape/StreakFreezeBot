#pragma once

#include "json.hpp"

template<typename ModelType, typename PayloadType>
struct Payload {
	ModelType Model;
	PayloadType Payload;
};

template<typename ModelType, typename PayloadType>
inline void to_json(nlohmann::json& j, const Payload<ModelType, PayloadType>& payload) {
	nlohmann::adl_serializer<ModelType>::to_json(j, payload.Model);
	nlohmann::adl_serializer<PayloadType>::to_json(j, payload.Payload);
}