import { GetPersistentCompletion, GetPersistentTodo } from "../helpers/Requests";
import { FromApiDateNullable } from "./UserContextSerialization";
import isEqual from 'lodash/isEqual';

export class ToDoDescription {
	public Started: Date | null = null
	public List: Array<string> = []

	constructor(started: Date | null = null, list: Array<string> = []) {
        this.Started = started;
        this.List = list;
    }

	public IsPending(): boolean {
		return this.Started === null
	}

	public IsRunning(): boolean {
		return !this.IsPending()
	}

	public Equal(other: ToDoDescription) {
		return isEqual(this.List, other.List)
	}
};


export const ParseToDoDescriptionType = (data: any): ToDoDescription => {
	const descr = new ToDoDescription();

	descr.Started = FromApiDateNullable(data.Started);
	descr.List = (data.List || []).map((value: any): string => value);

    return descr;
}

export const FetchPersistentTodo = async () => {
	const full_resp = await GetPersistentTodo()

	return ParseToDoDescriptionType(await full_resp.json())
}

export class ToDoCompletion {
	public Checks: Array<number> = []

	public IsComplete(todo: ToDoDescription): boolean {
		for (let i = 0; i < todo.List.length; i++) {
			if (!this.Checked(i))
				return false
		}
		return true
	}

	public Checked(index: number) {
		return this.Checks.find(e => e === index) !== undefined
	}
}

export const ParseToDoCompletionType = (data: any): ToDoCompletion => {
	const compl = new ToDoCompletion();

	compl.Checks = (data.Checks || []).map((value: any): number => value);

    return compl;
}

export const FetchPersistentCompletion = async () => {
	const full_resp = await GetPersistentCompletion()

	return ParseToDoCompletionType(await full_resp.json())
}
