#include "todo.hpp"
#include <boost/range/algorithm.hpp>

void ToDoCompletion::Set(std::int8_t index, bool value){
	if (value && !boost::count(Checks, index)) {
		Checks.push_back(index);
	}

	if (!value) {
		auto it = boost::find(Checks, index);
		
		if (it != Checks.end()) {
			std::swap(Checks.back(), *it);
			Checks.pop_back();
		}
	}
}

bool ToDoCompletion::IsComplete(const ToDoDescription& desc)const {
	for(int i = 0; i<desc.List.size(); i++)
		if(!boost::count(Checks, i))
			return false;

	return true;
}
