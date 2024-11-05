import { Avatar, Text } from "@xelene/tgui"
import { differenceInDays } from "date-fns"
import { useParams } from "react-router"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { useGetUserContext } from "../core/UserContext"
import {  PlaceholderUrlFor } from "../helpers/Requests"
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

	return (
		<div style={{padding: '5%'}}>
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

			{ Status }

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
