import { Button, Placeholder, Banner, Avatar, Text } from "@xelene/tgui"
import React, { useState } from "react"
import { FetchFriends, FriendType } from "../core/Friend"
import { Img } from "../core/Img"
import { ProtectionType } from "../core/UserContext"
import { MakeInviteLink } from "../helpers/Friends"
import { PostNudge, PostRemoveFriend, ProfilePhotoUrlFor } from "../helpers/Requests"
import { GetImageLinkFor } from "../helpers/Resources"
import { Loading } from "./Loading"
import { Entry } from "../core/Entry"

const FriendEntry: React.FC<{ friend: FriendType, onRemoved: ()=>void }> = ({ friend, onRemoved }) => {
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

	const Keyboard = (
		<React.Fragment key=".0">
			{ NudgeButton }
			<Button
				mode="plain"
				size="s"
				onClick={OnRemove}
			>
				Remove
			</Button>
		</React.Fragment>
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
			onClick={OnOpenProfile}
		>
			<Text
				weight="2"
				onClick={OnOpenProfile}
			>
				{friend.FullName}
			</Text>
		</Entry>	
	)

	return (
		<Banner
			before={FriendAvatar}
			header={Header}
			subheader={friend.Streak === 0 ? 'No streak?' : `${friend.Streak} day${friend.Streak === 1 ? '' : 's'} streak`}
			type="section"
			style={{background: 'var(--tg-theme-header-bg-color)', marginBottom: '5px'}}
		>
			{Keyboard }
		</Banner>
	)
}

export const FriendsSection = () => {

	const [friends, setFriends] = useState<FriendType[]>()

	const Refresh = () => FetchFriends().then(setFriends)

	if (friends === undefined)
		Refresh()

	const OnInvite = () => {
		const link = MakeInviteLink()

		if (link === undefined)
			return

		const text = 'Join me on StreakFreeze!'

		const telegramLink = `https://t.me/share/url?url=${link}&text=${text}`

		window.Telegram?.WebApp.openTelegramLink(telegramLink)
	}

	const Friends = friends?.map(friend => (
		<FriendEntry friend={friend} onRemoved={Refresh}/>
	))

	const FriendsPlaceholder = (
		<Placeholder
			action={<Button size="l" stretched onClick={OnInvite}>Invite Friends</Button>}
			description="Send invite link to add a friend"
			header="No Friends?"
		>		
			<img 
				style={{width: '40%'}}
				alt="Telegram sticker"
				src="https://xelene.me/telegram.gif"
			/>
		</Placeholder>
	)

	const FriendsList = (
		<div>
			<div>
				{Friends ?? <div></div>}
			</div>
			<br/>
			<Button onClick={OnInvite} stretched>Invite More</Button>
		</div>
	)

	if (Friends === undefined)
		return (<Loading/>)

	return Friends.length === 0? FriendsPlaceholder : FriendsList
}