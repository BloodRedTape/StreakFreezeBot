import { Button, Text} from "@xelene/tgui"
import { useState } from "react"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ErrorPopupFromJson, JsonFromResp, PostNewChallenge } from "../helpers/Requests"
import { DateInput } from "@nextui-org/date-input";
import { Input } from "@nextui-org/input";
import { useNavigate } from "react-router"
import { Spacer } from "@nextui-org/spacer";
import { DateValue, CalendarDate, CalendarDateTime, ZonedDateTime } from '@internationalized/date';
import { ToDoEdit, ToDoEntry } from "./ToDoEdit"

export const FromDateInputDate = (date: DateValue) => {
	if (date instanceof CalendarDate || date instanceof CalendarDateTime || date instanceof ZonedDateTime) {
		return new Date(date.year, date.month - 1, date.day);
	}

	return new Date();
}

export const ToDateInputDate = (date: Date): DateValue => {
	return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const ValidateDuration = (value: any, min: number, max: number) => {
	const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) 
		return "Please enter a number";

    if (parsedValue < min) 
		return `Duration must be at least ${min}`;
    
    if (parsedValue > max) 
		return `Duration must be at most ${max}`;

    return true;
}

export const ChallengeInput = () => {
	const setUserContext = useSetUserContext()
	const userContext = useGetUserContext()

	const today = userContext?.Today ?? new Date()

	const [name, setName] = useState<string>("")
	const [date, setStartDate] = useState<DateValue>(ToDateInputDate(today))
	const [duration, setDuration] = useState<number>(1)
	const [toDo, setToDo] = useState<string[]>([])

	const navigate = useNavigate()
	
	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const MakeEntry = (toDo: string, index: number): ToDoEntry => {
		const entry: ToDoEntry = {
			Id: index,
			Name: toDo,
			Removable: true
		}
		return entry
	}

	const Entries = toDo.map(MakeEntry)

	const OnAddEntry = (entry: string) => {
		setToDo(toDo.concat([entry]))	
	}

	const OnRemoveEntry = (entry: ToDoEntry) => {
		setToDo(toDo.filter(e => e !== entry.Name))
	}

	const OnNewChallenge = () => {
		const OnJson = (json: any) => {
			if(!ErrorPopupFromJson(json))
				navigate(-1)
		}

		const ourDate = FromDateInputDate(date)

		PostNewChallenge(name, ourDate, duration, toDo).then(JsonFromResp).then(OnJson).then(Refresh);
	}

	const DefaultSpacer = (<Spacer y={3}/>)

	return (
		<div style={{padding: '5%'}}>
			<Text weight="2">
				Enter challenge details!
			</Text>

			{DefaultSpacer}

			<Input
				labelPlacement="outside"
				label="Name"
				placeholder="Do something cool for 30 days."
				value={name}
				onChange={e => setName(e.target.value)}
			/>

			{DefaultSpacer}

			<Input
				labelPlacement="outside"
				label="Duration"
				type="number"
				value={duration.toString()}
				validate={ s => ValidateDuration(s, 1, 365) }
				onValueChange={(value) => setDuration(parseInt(value))}
			/>

			{DefaultSpacer}

			<DateInput
				labelPlacement="outside"
				label="Start date"
				onChange={setStartDate}
				minValue={ToDateInputDate(today)}
				defaultValue={ToDateInputDate(today)}
			/>

			{DefaultSpacer}

			<Text weight="2">To Do</Text>

			<ToDoEdit
				entries={Entries}
				addEntry={OnAddEntry }
				removeEntry={OnRemoveEntry }
			/>

			{DefaultSpacer}

			<Button
				stretched
				size="m"
				onClick={OnNewChallenge}
			>
				Create	
			</Button>
		</div>
	)
}

