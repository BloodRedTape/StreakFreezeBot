import { Listbox, ListboxItem } from "@nextui-org/react"
import { Modal, Text, Button } from "@xelene/tgui"
import { differenceInDays } from "date-fns"
import { useQuery } from "react-query"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ChallengeInviteType } from "../helpers/Challenges"
import { ErrorPopupFromJson, FetchChallengeInvitePreview, GatherCurrentUserId, PostJoinChallenge } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"
import { ChallengeHeader } from "./ChallengeHeader"

const Status: React.FC<{ text: string }> = ({text}) => {
	return (
		<Text weight="2">{text}</Text>
	)
}

type ToDoEntry = {
	Name: string
}

const ChallengeInvite: React.FC<{ invite: ChallengeInviteType, onAccepted: ()=>void}> = ({ invite, onAccepted }) => {
	const OnAccept = () => {
		PostJoinChallenge(invite.challenge).then(ErrorPopupFromJson).then(() => {
			onAccepted()
		})
	}

	const userContext = useGetUserContext()

	const {data, isLoading, isError } = useQuery([invite.challenge, invite.from], () => FetchChallengeInvitePreview(invite.challenge))

	if (isError)
		return <Status text={"Expired invite link, can't join challenge"}/>

	if (isLoading || userContext === undefined)
		return <Status text={"Loading..."} />

	if (data === undefined)
		return <Status text={"Internal error"} />

	const today = userContext.Today

	const Starting = (
		<Text weight="3">
			{data.IsPending(today) ? `Starts in ${differenceInDays(data.Start, today)} days` : `Starts now!`}
		</Text>
	)

	return (
		<div style={{ padding: '5%' }}>
			<ChallengeHeader challenge={data} />
			<br/>

			{Starting}

			<br/>

			<Text weight="2">ToDo</Text>

			<br />

			<Listbox
				items={data.ToDo.map((e): ToDoEntry => { return { Name: e } })}
				style={{ marginTop: '10px', marginBottom: '10px' }}
				className="bg-content2 rounded-small"
				emptyContent={<div />}
				itemClasses={{ base: "h-9" }}
				shouldHighlightOnFocus={false}
			>
				{(entry) =>
					<ListboxItem key={entry.Name}>
						{entry.Name}
					</ListboxItem>
				}
			</Listbox>

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