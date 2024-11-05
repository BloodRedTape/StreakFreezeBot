#pragma once

#include <rx/ranges.hpp>


template<typename ObjectType, typename ReturnType, typename ItemType, typename...ArgsType>
auto filter(const ObjectType *object, ReturnType (ObjectType::*method)(ItemType, ArgsType...)const, const std::remove_reference_t<ArgsType>&...args) {
	return rx::filter([=](const ItemType &item) {
		return ((*object).*method)(item, args...);
	});
}

template<typename ItemType, typename ReturnType, typename...ArgsType>
auto filter(ReturnType (ItemType::*method)(ArgsType...)const, const std::remove_reference_t<ArgsType>&...args) {
	return rx::filter([=](const ItemType &item) {
		return (item.*method)(args...);
	});
}

template<typename ItemType, typename FieldType>
auto filter(FieldType ItemType::*field) {
	return rx::filter([=](const ItemType &item) {
		return item.*field;
	});
}


template<typename ObjectType, typename ReturnType, typename ItemType, typename...ArgsType>
auto transform(const ObjectType *object, ReturnType (ObjectType::*method)(ItemType, ArgsType...)const, const std::remove_reference_t<ArgsType>&...args) {
	return rx::transform([=](const ItemType &item) {
		return ((*object).*method)(item, args...);
	});
}

template<typename ItemType, typename ReturnType, typename...ArgsType>
auto transform(ReturnType (ItemType::*method)(ArgsType...)const, const std::remove_reference_t<ArgsType>&...args) {
	return rx::transform([=](const ItemType &item) {
		return (item.*method)(args...);
	});
}

template<typename ItemType, typename FieldType>
auto transform(FieldType ItemType::*field) {
	return rx::transform([=](const ItemType &item) {
		return item.*field;
	});
}


template<typename RangeType, typename ReturnType = std::remove_cvref_t<decltype(*rx::begin(std::declval<RangeType>()))>>
auto min(RangeType&& range) -> std::optional<ReturnType> {
	std::optional<ReturnType> result;

	for (const auto& e : range) {
		if(!result.has_value() || e < result.value())
			result = e;
	}

	return result;
}
