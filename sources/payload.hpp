#pragma once

#include "json.hpp"

template<typename ModelType, typename PayloadType>
struct Payload {
	ModelType Model;
	PayloadType PayloadData;

	Payload() = default;

	Payload(const ModelType &model, const PayloadType &payload):
		Model(model),
		PayloadData(payload)
	{}

	template<typename FirstType, typename SecondType>
	Payload(FirstType &&model, SecondType &&payload):
		Model(std::forward<FirstType>(model)),
		PayloadData(std::forward<SecondType>(payload))
	{}

	Payload(const Payload &other):
		Model(other.Model),
		PayloadData(other.PayloadData)
	{}

	Payload(Payload &&other)noexcept:
		Model(std::move(other.Model)),
		PayloadData(std::move(other.PayloadData))
	{}

	Payload &operator=(const Payload &other) {
		Model = other.Model;	
		PayloadData = other.PayloadData;	
		return *this;
	}

	Payload &operator=(Payload &&other)noexcept {
		Model = std::move(other.Model);	
		PayloadData = std::move(other.PayloadData);	
		return *this;
	}
};

template<typename ModelType, typename PayloadType>
inline void to_json(nlohmann::json& j, const Payload<ModelType, PayloadType>& payload) {
	nlohmann::adl_serializer<ModelType>::to_json(j, payload.Model);
	nlohmann::adl_serializer<PayloadType>::to_json(j, payload.PayloadData);
}