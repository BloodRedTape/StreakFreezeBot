import { Button, Placeholder, Avatar, Text } from "@xelene/tgui"
import { useState } from "react"
import { FetchFriends, FriendType } from "../core/Friend"
import { Img } from "../core/Img"
import { ProtectionType } from "../core/UserContext"
import { MakeInviteLink } from "../helpers/Friends"
import { PostRemoveFriend, ProfilePhotoUrlFor } from "../helpers/Requests"
import { GetFriendStatusImageLinkFor, ShareIcon } from "../helpers/Resources"
import { Loading } from "./Loading"
import { Entry } from "../core/Entry"
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit"
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive"
import { useCookies } from "react-cookie"
import { NudgeButton } from "./Nudge"
import { Listbox, ListboxItem } from "@nextui-org/react"
import { Header, HeaderActionButton } from "../core/Header"

const MakeFriendEntry = (friend: FriendType, onRemoved: ()=>void, isEdit: boolean) => {
	const OnOpenProfile = () => {
		window.Telegram?.WebApp.openTelegramLink('https://t.me/' + friend.Username)
	}

	const FriendAvatar = (
		<Avatar
			size={48}
			src={ProfilePhotoUrlFor(friend.Id)}
			fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
			onClick={OnOpenProfile}
			style={{marginLeft: '8px', marginRight: '8px'}}
		/>
	)

	const OnRemove = () => {
		PostRemoveFriend(friend.Id).finally(onRemoved)
	}

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
							height: '22px',
							width: '22px',
							marginTop: 'auto',
							marginBottom: 'auto',
							marginLeft: '5px'
						}}
						src={GetFriendStatusImageLinkFor(friend.TodayProtection)}
					/>
					: undefined
			}
			afterFloatLeft={true}
			childrenBoxStyle={{ textOverflow: 'ellipsis' }}
		>
			<Text
				weight="2"
				style={{
					display: 'block',
					whiteSpace: 'nowrap',
					textOverflow: 'ellipsis',
					overflow: 'hidden'
				}}
			>
				{friend.FullName}
			</Text>
		</Entry>	
	)

	const FriendSubheader = friend.Streak === 0 ? 'No streak?' : `${friend.Streak} day${friend.Streak === 1 ? '' : 's'} streak`
	const EndButton = (
		<div style={{width: '100px'}}>
			{ isEdit ? RemoveButton : (<NudgeButton friend={friend }/>) }
		</div>
	)
	return (
		<ListboxItem
			key={friend.Id}
			startContent={FriendAvatar}
			endContent={EndButton}
			description={FriendSubheader}
			shouldHighlightOnFocus={false}
		>
			{ Header }
		</ListboxItem>
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

	const EditButton: HeaderActionButton = {
		text: "Edit",
		icon: <Icon28Edit />,
		onAction: () => setEdit(true)
	};

	const SaveButton: HeaderActionButton = {
		text: "Save",
		icon: <Icon28Archive />,
		onAction: () => setEdit(false)
	};

	const SectionHeader = (
		<Header
			title="Friends"
			actions={[
				edit ? SaveButton : EditButton,
				{
					icon: <ShareIcon/>,
					text: "Invite",
					onAction: OnInvite
				}
			]}
		/>
	)

	type FriendItemType = FriendType & { Edit: boolean }

	const FriendItems: FriendItemType[] = (friends ?? []).map((friend) => {
		const item: FriendItemType = {
			...friend,
			Edit: edit
		}	
		return item
	})

	const FriendsList = (
		<div>
			{ SectionHeader }
			<Listbox
				items={FriendItems}
				style={{ marginTop: '10px', marginBottom: '10px' }}
				className="bg-content2 rounded-small"
				emptyContent={<div />}
				itemClasses={{ base: "h-16" }}
				shouldHighlightOnFocus={false}
			>
				{(friend) => MakeFriendEntry(friend, Refresh, friend.Edit)}
			</Listbox>
		</div>
	)

	if (friends === undefined)
		return (<Loading/>)

	return friends.length === 0 ? FriendsPlaceholder : FriendsList
}
