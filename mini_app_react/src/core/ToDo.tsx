import { GetPersistentTodo } from "../helpers/Requests";
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
