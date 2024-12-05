import { Avatar } from "@telegram-apps/telegram-ui"
import { ProfilePhotoUrlFor } from "../helpers/Requests"
import WebApp from '@twa-dev/sdk'

type ProfileAvatarProps = {
	username: string
	id: number
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({username, id}) => {
	const OnOpenProfile = () => {
		WebApp.openTelegramLink('https://t.me/' + username)
	}

	return (
		<Avatar
			size={48}
			src={ProfilePhotoUrlFor(id)}
			fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
			onClick={OnOpenProfile}
			style={{marginLeft: '8px', marginRight: '8px'}}
		/>
	)
}