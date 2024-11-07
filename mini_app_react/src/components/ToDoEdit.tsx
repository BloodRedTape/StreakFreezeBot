import { Input, Listbox, ListboxItem, Spacer } from "@nextui-org/react"
import { IconButton, Text } from "@xelene/tgui"
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { CSSProperties, useState } from "react"

export type ToDoEntry = {
	Id: number
	Name: string
	Removable: boolean
}

export type ToDoEditProps = {
	entries: Array<ToDoEntry>
	addEntry: (entry: string)=>void
	removeEntry: (entry: ToDoEntry)=>void
}

export const ToDoEdit: React.FC<ToDoEditProps> = ({ entries, addEntry, removeEntry }) => {
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
				<Icon28Close />
			</IconButton>
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

	return (
		<div>
			<Listbox 
				items={entries}
				className="bg-content2 rounded-small"
				emptyContent={<Text weight="3">Empty ToDo</Text>}
				itemClasses={{base: "h-9"}}
				shouldHighlightOnFocus={false}
			>
				{(item) => (
					<ListboxItem
						key={item.Name}
						endContent={MakeRemoveEntryButton(item)}
					>
						{item.Name}
					</ListboxItem>
				)}
			</Listbox>

			<Spacer y={3}/>

			{ EditCurrentEntry }
		</div>
	)
}