import { Avatar, Text } from "@xelene/tgui"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { PlaceholderUrlFor } from "../helpers/Requests"

export const ChallengeHeader: React.FC<{ challenge: ChallengeWithPayloadType }> = ({challenge }) => {
	return (
		<div style={{ paddingTop: '10px', paddingBottom: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
			<Avatar
				size={48}
				src={PlaceholderUrlFor(challenge.Name)}
				style={{
					marginLeft: 'auto',
					marginRight: 'auto'
				}}
			/>
			<Text
				weight="2"
				style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}
			>
				{challenge.Name}
			</Text>
		</div>
	)
}