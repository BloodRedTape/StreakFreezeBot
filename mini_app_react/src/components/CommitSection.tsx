import { ToDoDescription } from "../core/ToDo";
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostPersistentTodo } from "../helpers/Requests";
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
		PostPersistentTodo(todo).then(JsonFromResp).then(PopupFromJson).then(Refresh)
	}

	return (
		<div>
			<ToDoSection title="Persistent" value={userContext?.PersistentTodo ?? new ToDoDescription()} onEdited={OnEdited}/>
		</div>
	)
};
