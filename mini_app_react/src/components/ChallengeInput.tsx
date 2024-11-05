import { Button, IconButton, Text} from "@xelene/tgui"
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { useState } from "react"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ErrorPopupFromJson, JsonFromResp, PostNewChallenge } from "../helpers/Requests"
import { DateInput } from "@nextui-org/date-input";
import { Input } from "@nextui-org/input";
import { useNavigate } from "react-router"
import { Spacer } from "@nextui-org/spacer";
import { Listbox, ListboxItem } from "@nextui-org/react"
import { DateValue, CalendarDate, CalendarDateTime, ZonedDateTime } from '@internationalized/date';

const FromDateInputDate = (date: DateValue) => {
	if (date instanceof CalendarDate || date instanceof CalendarDateTime || date instanceof ZonedDateTime) {
		return new Date(date.year, date.month - 1, date.day);
	}

	return new Date();
}

const ToDateInputDate = (date: Date): DateValue => {
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
	const [entry, setEntry] = useState<string>("")
	const [toDo, setToDo] = useState<string[]>([])

	const navigate = useNavigate()
	
	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnNewChallenge = () => {
		const OnJson = (json: any) => {
			if(!ErrorPopupFromJson(json))
				navigate(-1)
		}

		const ourDate = FromDateInputDate(date)

		PostNewChallenge(name, ourDate, duration, toDo).then(JsonFromResp).then(OnJson).then(Refresh);
	}

	const MakeRemoveEntryButton = (entry: string) => {
		const OnRemove = () => {
			setToDo(
				toDo.filter(e => e !== entry)
			)
		}

		return (
			<IconButton size='s' mode='plain' onClick={OnRemove}>
				<Icon28Close/>
			</IconButton>
		)
	}

	
	const CanAddEntry = !toDo?.includes(entry);

	const OnAddEntry = () => {
		if (entry.length === 0 || !CanAddEntry)
			return

		setToDo(toDo.concat([entry]))
		setEntry("")
	}

	const AddCurrentEntry = (
		<IconButton
			size='s'
			mode='plain'
			onClick={OnAddEntry}
			style={{ marginLeft: 'auto', marginRight: '0px' }}
		>
			<Icon28AddCircle />
		</IconButton>
	)

	const ValidateToDoEntry = (e: any) => {
		if (toDo.includes(e))
			return `'${e}' is already in todo list`

		return true
	}

	const EditCurrentEntry = (
		<Input
			placeholder="Clean your house!"
			value={entry}
			onChange={e => setEntry(e.target.value)}
			style={{ marginLeft: '0px', marginRight: '0px' }}
			validate={ValidateToDoEntry}
			endContent={AddCurrentEntry }
		/>
	)

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
				validate={ s => ValidateDuration(s, 1, 120) }
				onValueChange={(value) => setDuration(parseInt(value))}
			/>

			{DefaultSpacer}

			<DateInput
				labelPlacement="outside"
				label="Start date"
				onChange={setStartDate}
				minValue={ToDateInputDate(today)}
			/>

			{DefaultSpacer}

			<Listbox
				items={toDo.map(e => { return { Name: e } })}
			>
				{(item) => (
					<ListboxItem
						key={item.Name}
						endContent={MakeRemoveEntryButton(item.Name)}
					>
						{item.Name}
					</ListboxItem>
				)}
			</Listbox>

			{DefaultSpacer}

			{ EditCurrentEntry }

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

