import { Input, Listbox, ListboxItem, Spacer } from "@nextui-org/react"
import { IconButton } from "@telegram-apps/telegram-ui"
import { Icon28AddCircle } from "@telegram-apps/telegram-ui/dist/icons/28/add_circle"
import { CSSProperties, useState } from "react"
import { ListPlaceholder } from "../core/ListPlaceholder"
import { DeleteForeverIcon, NotVisibleIcon, VisibleIcon } from "../helpers/Resources"

export type ToDoEntry = {
	Id: number
	Name: string
	Removable: boolean 
	Visible?: boolean
}

export type ToDoEditProps = {
	entries: Array<ToDoEntry>
	addEntry: (entry: string)=>void
	removeEntry: (entry: ToDoEntry)=>void
	setVisibility?: (id: number, visibility: boolean) => void
}

export const ToDoEdit: React.FC<ToDoEditProps> = ({ entries, addEntry, removeEntry, setVisibility}) => {
	const [entry, setEntry] = useState<string>("")

	const ValidateToDoEntry = (e: any) => {
		if (entries.map(e => e.Name).includes(e))
			return `'${e}' is already in todo list`

		return true
	}

	const CanAddEntry = !entries.map(e => e.Name).includes(entry);

	const OnAddEntry = () => {
		if (entry.length === 0 || !CanAddEntry)
			return

		addEntry(entry)
		setEntry("")
	}

	const MakeRemoveEntryButton = (entry: ToDoEntry) => {
		const OnRemove = () => {
			if (!entry.Removable)
				return

			removeEntry(entry)
		}

		const buttonStyle: CSSProperties = {
			opacity: entry.Removable ? 1 : 0,
			cursor: entry.Removable ? undefined : 'default'
		}

		return (
			<IconButton size='s' mode='plain' onClick={OnRemove} style={buttonStyle}>
				{ DeleteForeverIcon() }
			</IconButton>
		)
	}

	const MakeChangeEntryVisibilityButton = (entry: ToDoEntry) => {
		if (entry.Visible === null || entry.Visible === undefined || setVisibility === undefined || setVisibility === null)
			return <div />;


		const OnToggle = () => {
			setVisibility(entry.Id, !entry.Visible);
		}

		return (
			<IconButton size='s' mode='plain' onClick={OnToggle}>
				{ entry.Visible ? VisibleIcon() : NotVisibleIcon() }
			</IconButton>
		)
	}

	const MakeEntryEndContent = (entry: ToDoEntry) => {
		return (
			<div>
				{[
					MakeChangeEntryVisibilityButton(entry),
					MakeRemoveEntryButton(entry)
				]}
			</div>
		)
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

	const EditCurrentEntry = (
		<Input
			placeholder="Clean your house!"
			value={entry}
			onChange={e => setEntry(e.target.value)}
			style={{ marginLeft: '0px', marginRight: '0px' }}
			validate={ValidateToDoEntry}
			endContent={AddCurrentEntry}
		/>
	)

	const Items = (
			<Listbox 
				items={entries}
				className="bg-content2 rounded-small"
				emptyContent={<div/>}
				itemClasses={{ base: "h-9" }}
				shouldHighlightOnFocus={false}
			>
				{(item) => (
					<ListboxItem
						key={item.Name}
						endContent={MakeEntryEndContent(item)}
					>
						{item.Name}
					</ListboxItem>
				)}
			</Listbox>
	)

	return (
		<div>
			{ entries.length ? Items : <ListPlaceholder text="Add ToDo entries now!"/> }

			<Spacer y={3}/>

			{ EditCurrentEntry }
		</div>
	)
}