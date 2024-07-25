import { Button, Placeholder, Banner, Avatar } from "@xelene/tgui"
import React, { useState } from "react"
import { FetchFriends, FriendType } from "../core/Friend"
import { MakeInviteLink } from "../helpers/Friends"
import { PostRemoveFriend, ProfilePhotoUrlFor } from "../helpers/Requests"
import { Loading } from "./Loading"


const FriendEntry: React.FC<{ friend: FriendType, onRemoved: ()=>void }> = ({ friend, onRemoved }) => {
	const FriendAvatar = (
		<Avatar
			size={48}
			src={ProfilePhotoUrlFor(friend.Id) }
			fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
		/>
	)

	const OnRemove = () => {
		PostRemoveFriend(friend.Id).finally(onRemoved)
	}

	const Keyboard = (
		<React.Fragment key=".0">
			<Button
				mode="plain"
				size="s"
				onClick={OnRemove}
			>
				Remove
			</Button>
		</React.Fragment>
	)

	const streakMessage = friend.Streak === 0 ? 'No streak?' : `${friend.Streak} Days streak`

	return (
		<Banner
			before={FriendAvatar}
			header={friend.FullName}
			subheader={streakMessage}
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