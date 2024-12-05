import { Listbox, ListboxItem } from "@nextui-org/react"
import { Text } from "@telegram-apps/telegram-ui"

type ToDoEntry = {
	Name: string
}

export const ToDoPreview: React.FC<{ toDo: string[] }> = ({ toDo }) => {
	return (
			<Listbox
				items={toDo.map((e): ToDoEntry => { return { Name: e } })}
				style={{ marginTop: '10px', marginBottom: '10px' }}
				className="bg-content2 rounded-small"
				emptyContent={<div />}
				itemClasses={{ base: "h-9" }}
				shouldHighlightOnFocus={false}
			>
				{(entry) =>
					<ListboxItem
						key={entry.Name}
						//startContent={<Dot color="var(--tg-theme-accent-text-color)" size="8px"/> }
					>
						<Text weight="3">{entry.Name}</Text>
					</ListboxItem>
				}
			</Listbox>
	)
}
