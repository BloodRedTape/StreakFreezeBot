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
		PostPersistentTodo(todo).then(JsonFromResp).then(ErrorPopupFromJson).then(Refresh)
	}

	const [completion, setCompletion] = useState<ToDoCompletion>(new ToDoCompletion())

	const OnChangedComplection = (completion: ToDoCompletion) => {
		PostPersistentCompletion(completion).then(Refresh)
		setCompletion(completion)
	}

	let descr = new ToDoDescription(userContext?.Today, userContext?.Streaks.map(e=>e.Description))

	return (
		<div>
			<ToDoSection
				title="Persistent"
				value={descr}
				onEdited={OnEdited}
				completion={completion}
				onChangedCompletion={OnChangedComplection}
			/>
		</div>
	)
};
