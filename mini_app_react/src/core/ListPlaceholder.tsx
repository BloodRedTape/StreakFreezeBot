import { Listbox, ListboxItem } from "@nextui-org/react"
import { Text } from "@telegram-apps/telegram-ui"

export const ListPlaceholder: React.FC<{ text: string }> = ({text}) => {
	return <Listbox
		items={[]}
		emptyContent={
			<Text weight="3">{text}</Text>
		}
	>
		{() => (<ListboxItem key={"sdf"} />)}
	</Listbox>
}
