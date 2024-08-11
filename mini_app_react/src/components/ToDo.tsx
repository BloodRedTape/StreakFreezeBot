import { IconButton, Text, Checkbox, Button, Input, Section } from "@xelene/tgui"
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit"
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive"
import { CSSProperties, useState } from "react"
import { ToDoCompletion, ToDoDescription } from "../core/ToDo"
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

type OnChangeCompletion = (completion: ToDoCompletion)=>void

type ToDoUsageProperties = {
	value: ToDoDescription,
	completion: ToDoCompletion,
	onChangeCompletion: OnChangeCompletion,
	onChangeMode: OnChangeMode,
	title: string 
}

const ToDoUsage: React.FC<ToDoUsageProperties> = ({ value, completion, onChangeCompletion, onChangeMode, title }) => {
	const setUserContext = useSetUserContext()
	const userContext = useGetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}	

	const CanCommit = !userContext?.IsProtected() || false;
	const CanCheck = !userContext?.IsProtected() || false

	const OnCommit = () => {
		if (!CanCommit)
			return

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



	const Checkboxes = value.List.map((name, index) => {
		const IsChecked = () => {
			return completion.Checks.find(e => e === index) !== undefined
		}

		const SetCheck = (check: boolean) => {
			const newComplection = new ToDoCompletion()

			if (check)
				newComplection.Checks = completion.Checks.concat([index])
			else
				newComplection.Checks = completion.Checks.filter(e => e !== index)

			onChangeCompletion(newComplection)
		}

		const Box = IsChecked()
			? (<Checkbox checked disabled={!CanCheck} onChange={e => SetCheck(e.target.checked)} />)
			: (<Checkbox disabled={!CanCheck} onChange={e => SetCheck(e.target.checked)} />)
		
		return (
			<Entry
				before={<div style={AlignCenterStyle}>{ Box }</div>}
				after={<IconButton style={{ opacity: '0' }} size='s' mode='plain' disabled={true} ><Icon28Close /></IconButton>}
				style={{ padding: '5px' }}
			>
				<EntryText text={name} />
			</Entry>
		)
	})

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

type ToDoSectionProps = {
	completion: ToDoCompletion,
	onChangedCompletion: OnChangeCompletion,
	value: ToDoDescription,
	onEdited: OnChanged,
	title: string
}

export const ToDoSection: React.FC<ToDoSectionProps> = ({ value, completion, onChangedCompletion, onEdited, title }) => {

	const [edit, setEdit] = useState<boolean>(false)

	const OnStartEdit = () => {
		setEdit(true)
	}

	const OnFinishEdit = (todo: ToDoDescription) => {
		setEdit(false)
		onChangedCompletion(new ToDoCompletion())
		onEdited(todo)
	}

	return edit
		? (<ToDoEdit value={value} title={title} onFinishEdit={ OnFinishEdit } />)
		: (<ToDoUsage value={value} title={title} onChangeMode={OnStartEdit} completion={completion} onChangeCompletion={onChangedCompletion}/>)
}
