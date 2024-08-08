import { Button, Placeholder, Avatar, Text, Cell, Section } from "@xelene/tgui"
import React, { CSSProperties, useState } from "react"
import { FetchFriends, FriendType } from "../core/Friend"
import { Img } from "../core/Img"
import { ProtectionType } from "../core/UserContext"
import { MakeInviteLink } from "../helpers/Friends"
import { PostNudge, PostRemoveFriend, ProfilePhotoUrlFor } from "../helpers/Requests"
import { GetImageLinkFor } from "../helpers/Resources"
import { Loading } from "./Loading"
import { Entry } from "../core/Entry"
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit"
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive"
import { useCookies } from "react-cookie"

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

const EntryText: React.FC<{ text: string }> = ({text}) => (
	<Text weight="3" style={{marginLeft: '5px', textAlign: 'justify'}}>{text}</Text>
)

const FriendEntry: React.FC<{ friend: FriendType, onRemoved: ()=>void, isEdit: boolean }> = ({ friend, onRemoved, isEdit }) => {
	const OnOpenProfile = () => {
		window.Telegram?.WebApp.openTelegramLink('https://t.me/' + friend.Username)
	}

	const FriendAvatar = (
		<Avatar
			size={48}
			src={ProfilePhotoUrlFor(friend.Id)}
			fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
			onClick={OnOpenProfile}
		/>
	)

	const OnRemove = () => {
		PostRemoveFriend(friend.Id).finally(onRemoved)
	}

	const CanNudge = true;

	const OnNudged = () => {
		PostNudge(friend.Id)
	}

	const NudgeButton = (<Button size="s" onClick={OnNudged} disabled={!CanNudge}>Nudge</Button>)

	const RemoveButton = (
		<Button
			mode="plain"
			size="s"
			onClick={OnRemove}
		>
			Remove
		</Button>
	)

	const Header = (
		<Entry
			after={
				friend.TodayProtection !== ProtectionType.None
					? <Img
						style={{
							height: '24px',
							width: '24px',
							marginTop: 'auto',
							marginBottom: 'auto',
							marginLeft: '5px'
						}}
						src={GetImageLinkFor(friend.TodayProtection)}
					/>
					: undefined
			}
			afterFloatLeft={true}
		>
			<Text
				weight="2"
			>
				{friend.FullName}
			</Text>
		</Entry>	
	)

	const FriendSubheader = friend.Streak === 0 ? 'No streak?' : `${friend.Streak} day${friend.Streak === 1 ? '' : 's'} streak`

	return (
		<Cell
			before={FriendAvatar}
			after={ isEdit ? RemoveButton : NudgeButton }
			subtitle={FriendSubheader}
			style={{background: 'var(--tg-theme-header-bg-color)'}}
		>
			{ Header }
		</Cell>
	)
}

export const FriendsSection = () => {
	const [friendsState, setFriendsState] = useState<FriendType[]>()
	const [edit, setEdit] = useState(false)
	const [friendsCookies, setFriendsCookies] = useCookies(['Friends'])

	const Refresh = () => FetchFriends().then((friends) => {
		setFriendsCookies("Friends", friends)
		setFriendsState(friends)
	})

	if (friendsState === undefined) {
		Refresh()
	}

	const friends: FriendType[] | undefined = friendsState ?? friendsCookies.Friends

	const OnInvite = () => {
		const link = MakeInviteLink()

		if (link === undefined)
			return

		const text = 'Join me on StreakFreeze!'

		const telegramLink = `https://t.me/share/url?url=${link}&text=${text}`

		window.Telegram?.WebApp.openTelegramLink(telegramLink)
	}

	const Friends = friends?.map(friend => (
		<FriendEntry friend={friend} onRemoved={Refresh} isEdit={edit}/>
	))

	const FriendsPlaceholder = (
		<Placeholder
			action={<Button size="l" stretched onClick={OnInvite}>Share Invite Link</Button>}
			description="Share invite link to add a friend"
			header="No Friends?"
		>		
			<img 
				style={{width: '40%'}}
				alt="Telegram sticker"
				src="https://xelene.me/telegram.gif"
			/>
		</Placeholder>
	)

	const EditButton = (
		<Button
			size='s'
			mode='bezeled'
			onClick={()=>setEdit(true)}
			style={{ marginLeft: 'auto', marginRight: '0px' }}
		>
			<div style={AlignCenterStyle}>
				<Icon28Edit/>
				<EntryText text=" Edit"/>
			</div>
		</Button>
	)

	const SaveButton = (
		<Button
			size="s"
			mode="bezeled"
			onClick={()=>setEdit(false)}
			style={{ marginLeft: 'auto', marginRight: '0px' }}
		>
			<div style={AlignCenterStyle}>
				<Icon28Archive/>
				<EntryText text=" Save"/>
			</div>
		</Button>
	)

	const SectionHeader = (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">Friends</Text>
			{edit ? SaveButton : EditButton }
		</div>
	)

	const FriendsList = (
		<div>
			{ SectionHeader }
			<Section
				style={{marginTop: '10px', marginBottom: '10px'}}
			>
				{Friends ?? <div></div>}
			</Section>
			{edit
				? <Button onClick={OnInvite} stretched>Share Invite Link</Button>
				: null
			}
		</div>
	)

	if (Friends === undefined)
		return (<Loading/>)

	return Friends.length === 0? FriendsPlaceholder : FriendsList
}