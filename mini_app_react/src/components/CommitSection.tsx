import { useState } from "react";
import { ToDoCompletion, ToDoDescription } from "../core/ToDo";
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { ErrorPopupFromJson, JsonFromResp, PostPersistentCompletion, PostPersistentTodo } from "../helpers/Requests";
import { ToDoSection } from "./ToDo";

export const CommitSection = () => {

	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnEdited = (todo: ToDoDescription) => {
		if (userContext?.PersistentTodo !== undefined && todo.Equal(userContext?.PersistentTodo))
			return
		PostPersistentTodo(todo).then(JsonFromResp).then(ErrorPopupFromJson).then(Refresh)
	}

	const [completion, setCompletion] = useState<ToDoCompletion>(userContext?.PersistentCompletion ?? new ToDoCompletion())

	const OnChangedComplection = (completion: ToDoCompletion) => {
		PostPersistentCompletion(completion).then(Refresh)
		setCompletion(completion)
	}

	return (
		<div>
			<ToDoSection
				title="Persistent"
				value={userContext?.PersistentTodo ?? new ToDoDescription()}
				onEdited={OnEdited}
				completion={completion}
				onChangedCompletion={OnChangedComplection}
			/>
		</div>
	)
};
