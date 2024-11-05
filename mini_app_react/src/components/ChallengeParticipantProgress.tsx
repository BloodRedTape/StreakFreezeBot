import { Progress } from "@nextui-org/react"
import { Entry } from "../core/Entry"
import { Img } from "../core/Img"
import { ProtectionType } from "../core/UserContext"
import { GetFriendStatusImageLinkFor } from "../helpers/Resources"
import { Text } from "@xelene/tgui"


export const GetColorForProgress = (hasLost: boolean, commited: boolean) => {
	return hasLost ? "danger" : commited ? "warning" : "primary"
}

export type ChallengeParticipantProgressProps = {
	count: number
	duration: number
	hasLost: boolean
	commited: boolean
	compact: boolean
}

export const ChallengeParticipantProgress: React.FC<ChallengeParticipantProgressProps> = ({count, duration, hasLost, commited, compact}) => {

	const Label = <Text weight="3">{`${hasLost ? "Lost at" : "Progress"} ${count} of ${duration}`}</Text>

	const Fire = !commited ? undefined :
		<Img
			style={{
				height: '22px',
				width: '22px',
				marginTop: 'auto',
				marginBottom: 'auto',
				marginLeft: '5px'
			}}
			src={GetFriendStatusImageLinkFor(ProtectionType.Commit)}
		/>

	return (
		<div>
			{compact ? undefined : Label }
			<Entry after={Fire}>
				<Progress
					color={GetColorForProgress(hasLost, commited)}
					value={count / duration * 100}
				/>
			</Entry>
		</div>
	)
}