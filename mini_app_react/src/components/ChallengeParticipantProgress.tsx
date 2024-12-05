import { Progress } from "@nextui-org/react"
import { Entry } from "../core/Entry"
import { Img } from "../core/Img"
import { ProtectionType } from "../core/UserContext"
import { GetFriendStatusImageLinkFor } from "../helpers/Resources"
import { Text } from "@telegram-apps/telegram-ui"


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

	const Fire = 
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

	const Lost = <span className="text-danger" style={{ fontSize: '22px' }}>❌</span>

	const Status = commited
		? Fire
		: hasLost
			? Lost
			: undefined

	return (
		<div>
			{compact ? undefined : Label }
			<Entry after={Status}>
				<Progress
					color={GetColorForProgress(hasLost, commited)}
					value={count / duration * 100}
				/>
			</Entry>
		</div>
	)
}