import { IconButton, Text, Checkbox, Button, Input, Section } from "@xelene/tgui"
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit"
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive"
import { useState } from "react"
import { ToDoDescription } from "../core/ToDo"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { JsonFromResp, PopupFromJson, PostCommit } from "../helpers/Requests"
import { Entry } from "../core/Entry"


type OnChanged = (value: ToDoDescription) => void
type OnChangeMode = () => void

const EntryText: React.FC<{ text: string }> = ({text}) => (
	<Text weight="3" style={{marginLeft: '5px', textAlign: 'justify'}}>{text}</Text>
)

const ToDoEdit: React.FC<{ value: ToDoDescription, onChanged: OnChanged, onChangeMode: OnChangeMode, title: string }> = ({ value, onChanged, onChangeMode, title }) => {
	const OnSave = () => {
		onChanged(value)
		onChangeMode()
	}

	const SaveButton = (
		<IconButton
			size="s"
			mode="plain"
			onClick={OnSave}
			style={{ marginLeft: 'auto', marginRight: '5px' }}
		>
			<Icon28Archive/>
		</IconButton>
	)

	const Header = (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">{title ?? 'To Do'}</Text>
			{ SaveButton }
		</div>
	)

	const [entry, setEntry] = useState("")

	const OnAdd = () => {
		if (entry.length === 0)
			return

		if (value.List.find(e => e === entry) !== undefined)
			return

		const newValue: ToDoDescription = {
			List: value.List.concat([entry]),
			Started: value.Started
		}
		setEntry("")
		onChanged(newValue)
	}

	const OnRemove = (idx: number) => {

		const newValue: ToDoDescription = {
			List: value.List.filter((_value, index)=>idx !== index),
			Started: value.Started
		}

		onChanged(newValue)
	}

	const Entries = value.List.map((name, index) => (
		<Entry
			after={<IconButton size='s' mode='plain' onClick={() => OnRemove(index)}><Icon28Close /></IconButton>}
			style={{padding: '5px'}}
		>
			<EntryText text={name}/>
		</Entry>
	))

	const AddCurrent = (
		<IconButton
			size='s'
			mode='plain'
			onClick={OnAdd}
			style={{ marginLeft: 'auto', marginRight: '0px' }}
		>
			<Icon28AddCircle />
		</IconButton>
	)

	const EditCurrent = (
		<Entry
			after={AddCurrent}
			style={{padding: '5px'}}
		>
			<Input
				placeholder="Grow a really big plant!"
				value={entry}
				onChange={e => setEntry(e.target.value)}
				style={{marginLeft: '0px', marginRight: 'auto'}}
			/>
		</Entry>
	)

	return (
		<div style={{ display: 'block' }}>
			{ Header }
			<br/>
			<Section>
				{ Entries }
				{ EditCurrent }
			</Section>
		</div>
	)
}

const ToDoUsage: React.FC<{ value: ToDoDescription, onChangeMode: OnChangeMode, title: string }> = ({ value, onChangeMode, title }) => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const CanCommit = !userContext?.IsProtected() || false;

	const OnCommit = () => {
		PostCommit().then(JsonFromResp).then(PopupFromJson).then(Refresh);
	}

	const CommitButton = (
		<Button
			size="l"
			disabled={!CanCommit}
			stretched
			mode="filled"
			onClick={OnCommit}
		>
			Commit
		</Button>
	)

	const Checkboxes = value.List.map((name) => (
		<Entry
			before={<Checkbox name="checkbox" value="2" />}
			after={<IconButton style={{ opacity: '0' }} size='s' mode='plain' disabled={true} ><Icon28Close /></IconButton>}
			style={{padding: '5px'}}
		>
			<EntryText text={name}/>
		</Entry>
	))

	const OnEdit = () => {
		onChangeMode()
	}

	const Header = (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">{title ?? 'To Do'}</Text>
			<IconButton
				size='s'
				mode='plain'
				onClick={OnEdit}
				style={{ marginLeft: 'auto', marginRight: '5px' }}
			>
				<Icon28Edit/>
			</IconButton>
		</div>
	)

	return (
		<div style={{ display: 'block' }}>
			{ Header }
			<br/>
			<Section>
				{Checkboxes}
			</Section>
			<br/>
			{CommitButton}
		</div>
	)
}

export const ToDoSection: React.FC<{ value: ToDoDescription, onChanged: OnChanged, title: string }> = ({ value, onChanged, title }) => {

	const [edit, setEdit] = useState<boolean>(false)

	return edit
		? (<ToDoEdit onChanged={onChanged} value={value} title={title} onChangeMode={ ()=>setEdit(false) }/>)
		: (<ToDoUsage value={value} title={title} onChangeMode={ ()=>setEdit(true) }/>)
		
}
