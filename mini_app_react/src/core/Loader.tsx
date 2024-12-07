import { Spinner } from "@nextui-org/react"
import { Text } from "@telegram-apps/telegram-ui"


export const Loader: React.FC<{ text?: string }> = ({text}) => {
	return (
		<div>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column'
			}}>
				<Spinner size="lg" />
				<Text weight="3">{text}</Text>
			</div>
		</div>
	)
}