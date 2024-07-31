import { IconButton, Text, Checkbox, Button, Input, Section } from "@xelene/tgui"
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit"
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive"
import { CSSProperties, useState } from "react"
import { ToDoDescription } from "../core/ToDo"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { JsonFromResp, PopupFromJson, PostCommit } from "../helpers/Requests"
import { Entry } from "../core/Entry"


type OnChanged = (value: ToDoDescription) => void
type OnChangeMode = () => void

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

const EntryText: React.FC<{ text: string }> = ({text}) => (
	<Text weight="3" style={{marginLeft: '5px', textAlign: 'justify'}}>{text}</Text>
)

const ToDoEdit: React.FC<{ value: ToDoDescription, onFinishEdit: OnChanged, title: string }> = ({ value, onFinishEdit, title }) => {
	const [description, setDescription] = useState<ToDoDescription>(value)

	const OnSave = () => {
		onFinishEdit(description)
	}

	const SaveButton = (
		<Button
			size="s"
			mode="bezeled"
			onClick={OnSave}
			style={{ marginLeft: 'auto', marginRight: '5px' }}
		>
			<div style={AlignCenterStyle}>
				<Icon28Archive/>
				<EntryText text=" Save"/>
			</div>
		</Button>
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

		if (description.List.find(e => e === entry) !== undefined)
			return

		const newValue = new ToDoDescription(
			description.Started,
			description.List.concat([entry])
		)
		setEntry("")
		setDescription(newValue)
	}

	const OnRemove = (idx: number) => {

		const newValue = new ToDoDescription(
			description.Started,
			description.List.filter((_value, index)=>idx !== index)
		)

		setDescription(newValue)
	}

	const Entries = description.List.map((name, index) => (
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
				placeholder="Clean your house!"
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
			before={<div style={AlignCenterStyle}><Checkbox name="checkbox" value="2"/></div>}
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
			<Button
				size='s'
				mode='bezeled'
				disabled={ value.IsRunning() }
				onClick={OnEdit}
				style={{ marginLeft: 'auto', marginRight: '5px' }}
			>
				<div style={AlignCenterStyle}>
					<Icon28Edit/>
					<EntryText text=" Edit"/>
				</div>
			</Button>
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

export const ToDoSection: React.FC<{ value: ToDoDescription, onEdited: OnChanged, title: string }> = ({ value, onEdited, title }) => {

	const [edit, setEdit] = useState<boolean>(false)

	const OnStartEdit = () => {
		setEdit(true)
	}

	const OnFinishEdit = (todo: ToDoDescription) => {
		setEdit(false)
		onEdited(todo)
	}

	return edit
		? (<ToDoEdit value={value} title={title} onFinishEdit={ OnFinishEdit } />)
		: (<ToDoUsage value={value} title={title} onChangeMode={ OnStartEdit }/>)
}
