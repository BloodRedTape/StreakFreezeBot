import { Modal, Text, Button } from "@xelene/tgui"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { ExtendedContentType } from "../core/Extended"
import { Img } from "../core/Img"
import { GetExtendedStreakBorderColor, GetExtendedStreakFire } from "../helpers/Resources"
import { ForegroundColor } from "../helpers/Theme"
import { ChallengeParticipantProgress } from "./ChallengeParticipantProgress"


type ExtendedStreakProps = {
	count: number
	comment: string
	show: Array<ExtendedContentType>
	onExtendedFinish: () => void
	challenges: Array<ChallengeWithPayloadType>
}

export const ExtendedStreak: React.FC<ExtendedStreakProps> = ({ count, comment, show, onExtendedFinish, challenges}) => {

	const outlineColor = GetExtendedStreakBorderColor()

	const MakeExtendedChallenge = (challenge: ChallengeWithPayloadType) => {
		return (
			<div>
				<Text weight="2">{challenge.Name}</Text>
				<ChallengeParticipantProgress
					compact={true}
					commited={true}
					hasLost={challenge.HasLost}
					count={challenge.Count}
					duration={challenge.Duration}
				/>
			</div>
		)
	}

	const ExtendedActive = (
		<text style={{
			color: outlineColor,
			fontSize: 24,
			fontWeight: 'bold',
			fontFamily: 'arial'
		}}>
			{count} Day{count > 1 ? 's' : ''} streak!
		</text>
	)

	const ExtendedChallenges = (
		<div style={{ paddingTop: '10px', paddingBottom: '10px', width: '80vw' }}>
			{challenges.map(MakeExtendedChallenge)}
		</div>
	)
	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			padding: '5%',
		}}>
			<div>
				<Img
					style={{width: 'auto', height: '40vw'}}
					src={GetExtendedStreakFire()}
				/>
			</div>

			{show.includes(ExtendedContentType.Active) ? ExtendedActive : undefined}
			{show.includes(ExtendedContentType.Challenges) ? ExtendedChallenges : undefined}

			<Text weight="2" style={{ paddingTop: '10px', textAlign: 'center'}}>{comment}</Text>
			<Button
				stretched
				onClick={onExtendedFinish}
				style={{ marginTop: '5vh', marginBottom: '5%' }}
			>
				Continue
			</Button>
		</div>
	)
}

type ExtendedStreakModalProps = ExtendedStreakProps & {
	extended: boolean
}

export const ExtendedStreakModal: React.FC<ExtendedStreakModalProps> = ({ extended, onExtendedFinish, ...other }) => {

	return (
		<Modal
			open={extended}
			style={{ background: ForegroundColor() }}
		>
			<ExtendedStreak onExtendedFinish={onExtendedFinish} {...other}/>
		</Modal>
	)
}