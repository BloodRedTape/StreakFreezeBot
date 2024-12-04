import { Text } from "@xelene/tgui"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { ChallengeAvatar } from "./ChallengeAvatar"

export const ChallengeHeader: React.FC<{ challenge: ChallengeWithPayloadType }> = ({challenge }) => {
	return (
		<div style={{ paddingTop: '10px', paddingBottom: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
			<ChallengeAvatar
				size={"lg"}
				icon={challenge.Icon}
				iconBackground={challenge.IconBackground }
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