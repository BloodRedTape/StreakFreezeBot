import { useState } from "react";
import { ToDoDescription } from "../core/ToDo";
import { ToDoSection } from "./ToDo";

export const CommitSection = () => {

	const [description, setDescription] = useState<ToDoDescription>({
		Started: null,
		List: [
			"Wash dishes",
			"Love woman",
			"Do your job"
		]
	})

	return (
		<div>
			<ToDoSection title="Persistent" value={description} onChanged={setDescription}/>
		</div>
	)
};
