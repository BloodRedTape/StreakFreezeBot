import { Listbox, ListboxItem } from "@nextui-org/react"
import { Text } from "@xelene/tgui"

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
