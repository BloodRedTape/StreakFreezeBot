import { Modal, Text, Button } from "@telegram-apps/telegram-ui"
import { differenceInDays } from "date-fns"
import { useQuery } from "react-query"
import { Entry } from "../core/Entry"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ChallengeInviteType } from "../helpers/Challenges"
import { ErrorPopupFromJson, FetchChallengeInvitePreview, GatherCurrentUserId, PostJoinChallenge } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"
import { ChallengeHeader } from "./ChallengeHeader"
import { ChallengeParticipantPreview } from "./ChallengeParticipantPreview"
import { ToDoPreview } from "./ToDoPreview"

const Status: React.FC<{ text: string }> = ({text}) => {
	return (
		<Text weight="2">{text}</Text>
	)
}

const ChallengeInvite: React.FC<{ invite: ChallengeInviteType, onAccepted: ()=>void}> = ({ invite, onAccepted }) => {
	const OnAccept = () => {
		PostJoinChallenge(invite.challenge).then(ErrorPopupFromJson).then(() => {
			onAccepted()
		})
	}

	const userContext = useGetUserContext()

	const { data, isLoading, isError } = useQuery([invite.challenge, invite.from], () => FetchChallengeInvitePreview(invite.challenge))

	if (isError)
		return <Status text={"Expired invite link, can't join challenge"}/>

	if (isLoading || userContext === undefined)
		return <Status text={"Loading..."} />

	if (data === undefined)
		return <Status text={"Internal error"} />

	const today = userContext.Today

	const Starting = (
		<Text weight="3" style={{display: 'block', paddingBottom: '10px'} }>
			{data.IsPending() ? `Starts in ${differenceInDays(data.Start, today)} days` : `Starts now!`}
		</Text>
	)

	const Duration = (
		<Text weight="3" style={{display: 'block', paddingBottom: '10px'} }>
			{data.Duration } days long
		</Text>
	)

	return (
		<div style={{ padding: '5%' }}>
			<ChallengeHeader challenge={data} />

			<Entry
				after={Duration}
			>
				{Starting}
			</Entry>

			<Text weight="2">ToDo</Text>

			<ToDoPreview toDo={data.ToDo} />
			
			<Text weight="2" style={{paddingBottom: '5px'}}>Participants</Text>
			<ChallengeParticipantPreview challenge={invite.challenge} />

			<div style={{ paddingTop: '5%', paddingBottom: '5%' }}>
				<Button
					stretched
					onClick={OnAccept}
				>
					Join!
				</Button>
			</div>
		</div>
	)
}

const ShouldOpenInviteFrom = (from: ChallengeInviteType | undefined)=> {
	const noSelfRequest = false //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	const userContext = useGetUserContext()
		
	if (from === undefined || userContext === undefined)
		return false

	if (userContext.Challenges.find(c => c.Id === from.challenge) !== undefined)
		return false

	if (noSelfRequest && GatherCurrentUserId() === from.from)
		return false

	return true;
}

export const ChallengeInviteModal: React.FC<{ invite: ChallengeInviteType | undefined }> = ({ invite }) => { 
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const nullInvite: ChallengeInviteType = {
		from: 0,
		challenge: 0
	}

	return (
		<Modal
			header={<Modal.Header />}
			style={{ background: ForegroundColor() }}
			open={ShouldOpenInviteFrom(invite)}
		>
			<ChallengeInvite invite={invite ?? nullInvite} onAccepted={Refresh}/>
		</Modal>
	)
}