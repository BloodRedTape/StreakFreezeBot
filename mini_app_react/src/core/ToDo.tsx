import { FromApiDateNullable } from "./UserContextSerialization";


export class ToDoDescription {
	public Started: Date | null = null
	public List: Array<string> = []
};


export const ParseToDoDescriptionType = (data: any): ToDoDescription => {
	const descr = new ToDoDescription();

	descr.Started = FromApiDateNullable(data.Started);
	descr.List = (data.List || []).map((value: any): string => value);

    return descr;
}
