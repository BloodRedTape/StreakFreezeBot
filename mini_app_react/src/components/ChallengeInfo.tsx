import { Spacer } from "@nextui-org/react"
import { Text } from "@telegram-apps/telegram-ui"
import { differenceInDays } from "date-fns"
import { useNavigate, useParams } from "react-router"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { Entry } from "../core/Entry"
import { Header } from "../core/Header"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { MakeChallengeInviteLink } from "../helpers/Challenges"
import { ErrorPopupFromJson, JsonFromResp, PostLeaveChallenge } from "../helpers/Requests"
import { ShareIcon } from "../helpers/Resources"
import { ChallengeHeader } from "./ChallengeHeader"
import { ChallengeParticipantList } from "./ChallengeParticipant"
import { ChallengeParticipantProgress } from "./ChallengeParticipantProgress"
import { ToDoPreview } from "./ToDoPreview"
import WebApp from '@twa-dev/sdk'

const ChallengeInfo: React.FC<{ challenge: ChallengeWithPayloadType }> = ({ challenge }) => {
	const userContext = useGetUserContext()
	const today = userContext?.Today || new Date()
	const navigate = useNavigate()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}


	const PendingStatus =
		<Text weight="3">{`Starts in ${differenceInDays(challenge.Start, today)} days`}</Text>

	const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

	const StartText = <Text weight="3">{ `Start${challenge.IsPending() ? " at": "ed"} ${challenge.Start.toLocaleDateString("en-US", options)}` }</Text>

	const StartedStatus = (
		<div>
			<Entry
				after={StartText}
			>
				<Text weight="3">{ `Day ${challenge.DayOfChallenge + 1} of ${challenge.Duration}` }</Text>
			</Entry>
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

	const Status = challenge.IsPending() ? PendingStatus : challenge.IsRunning() ? StartedStatus : FinishedStatus

	const ShareInviteLink = () => {
		const link = MakeChallengeInviteLink(challenge.Id)

		if (link === undefined)
			return

		const text = `Join me on '${challenge.Name}' challenge in StreakFreeze!`

		const telegramLink = `https://t.me/share/url?url=${link}&text=${text}`

		WebApp.openTelegramLink(telegramLink)
	}

	const LeaveChallenge = () => {
		PostLeaveChallenge(challenge.Id).then(JsonFromResp).then(ErrorPopupFromJson).then(
			() => navigate('/edit_challenges')
		).then(Refresh)
	}

	return (
		<div style={{padding: '5%'}}>
			<ChallengeHeader challenge={challenge} />

			<Text weight="2">To Do</Text>
			<ToDoPreview toDo={challenge.ToDo} />

			<Spacer y={2}/>

			<Text weight="2">Status</Text>
			<div style={{display: 'block'}}>
				{Status}
			</div>

			<Spacer y={2} />

			<Header
				title="Participants"
				actions={
					challenge.CanJoin
				? [
					{
						text: "Invite",
						icon: <ShareIcon />,
						onAction: ShareInviteLink
					},
					{
						text: "Leave",
						icon: <div/>,
						onAction: LeaveChallenge
					}
				  ]
				: []
				}
			/>

			<Spacer y={1}/>

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
