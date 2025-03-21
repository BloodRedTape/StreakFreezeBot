import { Modal, Text, Button, Avatar} from "@telegram-apps/telegram-ui"
import { CSSProperties, useState } from "react"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { GatherCurrentUserId, GetTgFullUserById, JsonFromResp, PostAcceptInvite, ProfilePhotoUrlFor, SimplePopup } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"

const FriendRequest: React.FC<{ from: number, onAccepted: ()=>void}> = ({ from, onAccepted }) => {
	const OnAccept = () => {
		PostAcceptInvite(from).catch(() => {
			SimplePopup('Fail', 'Can not add a friend')
		}).then(onAccepted)
	}

	const CenteredStyle: CSSProperties = {
		marginLeft: 'auto',
		marginRight: 'auto'
	}

	const [user, setUser] = useState<string>()

	if (user === undefined)
		GetTgFullUserById(from).then(JsonFromResp).then((json)=>setUser(json.FullName ?? "Unknown Name")).catch(()=>SimplePopup('error', 'error'))

	return (
		<div style={{ padding: '5%'}}>
			<Avatar
				size={96}
				style={CenteredStyle}
				fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
				src={ProfilePhotoUrlFor(from)}
			/>
			<br/>
			<Text weight="1">{ user ?? "Loading Name..."}</Text>
			<br/>
			<Text weight="2">Wants to be your friend!</Text>

			<div style={{ paddingTop: '5%', paddingBottom: '5%' }}>
				<Button
					stretched
					onClick={OnAccept}
				>
					Accept
				</Button>
			</div>
		</div>
	)
}

const ShouldOpenInviteFrom = (from: number | undefined)=> {
	const noSelfRequest = true
	const userContext = useGetUserContext()
		
	if (from === undefined || userContext === undefined)
		return false

	if (userContext.IsAFriend(from))
		return false

	if (noSelfRequest && GatherCurrentUserId() === from)
		return false

	return true;
}

export const FriendRequestModal: React.FC<{ from: number | undefined }> = ({ from }) => { 
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	return (
		<Modal
			header={<Modal.Header />}
			style={{ background: ForegroundColor() }}
			open={ShouldOpenInviteFrom(from)}
		>
			<FriendRequest from={from ?? 0} onAccepted={Refresh}/>
		</Modal>
	)
}