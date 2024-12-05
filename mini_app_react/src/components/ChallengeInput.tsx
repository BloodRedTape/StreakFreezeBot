import { Button, Modal, Text} from "@telegram-apps/telegram-ui"
import { useState } from "react"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ErrorPopupFromJson, JsonFromResp, PostNewChallenge } from "../helpers/Requests"
import { Input } from "@nextui-org/input";
import { useNavigate } from "react-router"
import { Spacer } from "@nextui-org/spacer";
import { DateValue, CalendarDate, CalendarDateTime, ZonedDateTime } from '@internationalized/date';
import { ToDoEdit, ToDoEntry } from "./ToDoEdit"
import { DateInput } from "@nextui-org/react";
import { ChallengeAvatar } from "./ChallengeAvatar";
import { ForegroundColor } from "../helpers/Theme"

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

const ValidateDate = (value: DateValue, min: Date) => {
	if(FromDateInputDate(value) < min)
		return `Challenge can only start from ${min.toLocaleDateString('en-GB')}`;

	return true
}

type ChallengeAvatarSelectionProps = {
	icon: string,
	iconBackground: string
	onIcon: (icon: string) => void,
	onIconBackground : (icon: string) => void
}

const ChallengeAvatarPicker: React.FC<ChallengeAvatarSelectionProps> = ({ icon, iconBackground, onIcon, onIconBackground }) => {
	const icons = ["😆", "😍", "🥶", "🥵", "😭", "🤮", "😈", "💀", "💪", "👀", "👄", "🙏", "⚡️", "✨", "❤️", "💊", "🌿", "🔔", "🚗", "🏠", "⛰", "🍔", "✏️", "🍷", "🍺", "☕️"]
	const backgrounds = [
		"bg-gray-200",    // A light, neutral gray
		"bg-blue-400",    // A softer blue
		"bg-blue-500",    // A softer blue
		"bg-green-300",   // A fresh, soft green
		"bg-green-500",   // A fresh, soft green
		"bg-red-300",     // A warmer, softer red
		"bg-red-500",     // A warmer, softer red
		"bg-yellow-300",  // A sunny, soft yellow
		"bg-yellow-500",  // A sunny, soft yellow
		"bg-purple-300",  // A mild, pleasant purple
		"bg-indigo-400",  // A slightly toned down indigo
		"bg-pink-300",    // A calmer pink
		"bg-teal-300",    // A soft, refreshing teal
		"bg-orange-300"   // A gentle, warm orange
	];

	const [open, setOpen] = useState<boolean>(false)

	if (!icon.length)
		onIcon(icons[Math.floor(Math.random() * icons.length)])

	if (!iconBackground.length)
		onIconBackground(backgrounds[Math.floor(Math.random() * backgrounds.length)])

	const Avatar = (
		<ChallengeAvatar
			size="lg"
			icon={icon}
			iconBackground={iconBackground}
			onClick={()=>setOpen(true) }
		/>
	)

	const getRows = (array: string[], columns: number) => {
		const rows = [];
		for (let i = 0; i < array.length; i += columns) {
			rows.push(array.slice(i, i + columns));
		}
		return rows;
	};

	const columns = 6

	const backgroundRows = getRows(backgrounds, columns);

	const iconBackgrounds = (
		<table
			style={{
				marginLeft: 'auto',
				marginRight: 'auto'
			}}
		>
            <tbody>
                {backgroundRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((color, colIndex) => (
                            <td key={colIndex}>
								<Button
									size='m'
									mode='outline'
									onClick={() => onIconBackground(backgrounds[rowIndex * columns + colIndex])}
									style={{margin: '3px'}}
								>
									<div
										className={color}
										style={{
											width: '20px',
											height: '20px',
											borderRadius: '50%'
										}}
									/>
                                </Button>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );

	const emojiRows = getRows(icons, columns);

	const iconButtons = (
		<table
			style={{
				marginLeft: 'auto',
				marginRight: 'auto'
			}}
		>
			<tbody>
				{emojiRows.map((row, rowIndex) => (
					<tr key={rowIndex}>
						{row.map((emoji, colIndex) => (
							<td key={colIndex}>
								<Button
									size='m'
									mode='outline'
									onClick={() => onIcon(icons[rowIndex * columns + colIndex])}
									style={{margin: '3px'}}
								>
									<span role="img" aria-label={`emoji-${rowIndex * columns + colIndex}`}>{emoji}</span>
								</Button>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);

	const Content = (
		<div
			style={{
				padding: '5%',
			}}
		>
			{Avatar}
			<Spacer y={4} />
			{iconBackgrounds}
			<Spacer y={4}/>
			{iconButtons }
		</div>
	)

	return (
		<Modal
			trigger={Avatar}
			open={open}
			onOpenChange={setOpen}
			style={{background: ForegroundColor()} }
		>
			{Content}
		</Modal>
	)
}

export const ChallengeInput = () => {
	const setUserContext = useSetUserContext()
	const userContext = useGetUserContext()

	const today = userContext?.Today ?? new Date()


	const [name, setName] = useState<string>("")
	const [icon, setIcon] = useState<string>("")
	const [iconBackground, setIconBackground] = useState<string>("")
	const [date, setStartDate] = useState<DateValue>(ToDateInputDate(today))
	const [duration, setDuration] = useState<number>(7)
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

		PostNewChallenge(name, icon, iconBackground, ourDate, duration, toDo).then(JsonFromResp).then(OnJson).then(Refresh);
	}

	const DefaultSpacer = (<Spacer y={3} />)

	const DataComplete = name.length && toDo.length

	return (
		<div style={{padding: '5%'}}>
			<Text weight="2">
				Enter challenge details!
			</Text>

			<Spacer y={1} />

			<ChallengeAvatarPicker icon={icon} iconBackground={iconBackground} onIcon={setIcon} onIconBackground={setIconBackground}/>

			<Spacer y={1}/>

			<Input
				labelPlacement="outside"
				label="Name"
				placeholder="Do something cool for 30 days."
				value={name}
				onChange={e => setName(e.target.value)}
				classNames={{label: '-z-1'}}
			/>

			{DefaultSpacer}

			<DateInput
				labelPlacement="outside"
				label="Start date"
				onChange={setStartDate}
				minValue={ToDateInputDate(today)}
				validate={d => ValidateDate(d, today)}
				defaultValue={ToDateInputDate(today)}
			/>

			{DefaultSpacer}

			<Input
				labelPlacement="outside"
				label="Duration (days)"
				type="number"
				value={duration.toString()}
				validate={ s => ValidateDuration(s, 1, 365) }
				onValueChange={(value) => setDuration(parseInt(value))}
				classNames={{label: '-z-1'}}
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
				disabled={!DataComplete}
			>
				Create	
			</Button>
		</div>
	)
}

