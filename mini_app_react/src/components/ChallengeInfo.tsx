import { Text } from "@xelene/tgui"
import { differenceInDays } from "date-fns"
import { useParams } from "react-router"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { Header } from "../core/Header"
import { useGetUserContext } from "../core/UserContext"
import { MakeChallengeInviteLink } from "../helpers/Challenges"
import { ChallengeHeader } from "./ChallengeHeader"
import { ChallengeParticipantList } from "./ChallengeParticipant"
import { ChallengeParticipantProgress } from "./ChallengeParticipantProgress"

const ChallengeInfo: React.FC<{ challenge: ChallengeWithPayloadType }> = ({ challenge }) => {
	const userContext = useGetUserContext()
	const today = userContext?.Today || new Date()

	const PendingStatus = <Text weight="3">{`Starts in ${differenceInDays(challenge.Start, today)} days`}</Text>

	const StartedStatus = (
		<div>
			<Text weight="3">{ `Day ${challenge.DayOfChallenge + 1} of ${challenge.Duration}` }</Text>
			<ChallengeParticipantProgress 
				count={challenge.DayOfChallenge + 1}
				hasLost={false}
				duration={challenge.Duration}
				commited={false}
				compact={true}
			/>
		</div>
	)

	const FinishedStatus = <Text weight="3">{`Challenge took ${challenge.Duration} days`}</Text>

	const Status = challenge.IsPending(today) ? PendingStatus : challenge.IsRunning(today) ? StartedStatus : FinishedStatus

	const ShareInviteLink = () => {
		const link = MakeChallengeInviteLink(challenge.Id)

		if (link === undefined)
			return

		const text = `Join me on '${challenge.Name}' challenge in StreakFreeze!`

		const telegramLink = `https://t.me/share/url?url=${link}&text=${text}`

		window.Telegram?.WebApp.openTelegramLink(telegramLink)
	}

	return (
		<div style={{padding: '5%'}}>
			<ChallengeHeader challenge={challenge}/>

			{ Status }

			<Header
				title="Participants"
				actions={[
					{
						text: "Invite",
						icon: <div />,
						onAction: ShareInviteLink
					}
				]}
			/>

			<ChallengeParticipantList challenge={challenge}/>
		</div>
	)
}

export const ChallengeInfoPage = () => {
	const { id } = useParams()
	const userContext = useGetUserContext()

	if (id === undefined)
		return (<Text weight="2">Internal error, supply challenge id</Text>)


	const challenge = userContext?.Challenges.filter(c => c.Id === Number(id)) ?? []

	if(challenge.length !== 1)
		return (<Text weight="2">Internal error, invalid challenge id</Text>)

	return (<ChallengeInfo challenge={challenge[0]}/>)
}
