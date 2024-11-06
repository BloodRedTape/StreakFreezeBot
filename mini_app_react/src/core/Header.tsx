import { Button, Text } from "@xelene/tgui"
import { CSSProperties } from "react"

export type HeaderActionButton = {
	icon: JSX.Element,
	text: string
	onAction: () => void
}

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

export const EntryText: React.FC<{ text: string}> = ({text}) => (
	<Text weight="3" style={{ marginLeft: '5px', textAlign: 'justify' }}>{text}</Text>
)	

const MakeActionButton = (action: HeaderActionButton) => {
	return (
		<Button
			size='s'
			mode='bezeled'
			onClick={action.onAction}
			style={{ marginLeft: 'auto', marginRight: '5px' }}
		>
			<div style={AlignCenterStyle}>
				{action.icon}
				{action.text.length ? <EntryText text={' ' + action.text} /> : undefined }
			</div>
		</Button>
	)
}

export const Header: React.FC<{ title: string, actions: HeaderActionButton[] }> = ({ title, actions }) => {
	return (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">{title}</Text>
			<div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
				{actions.map(MakeActionButton) }
			</div>
		</div>
	)
}
