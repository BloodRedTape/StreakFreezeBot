import { Avatar } from "@nextui-org/react"


export type ChallengeAvatarProps = {
	size: "sm" | "md" | "lg"
	icon: string,
	iconBackground: string
	onClick?: ()=>void
}

export const ChallengeAvatar: React.FC<ChallengeAvatarProps> = ({size, icon, iconBackground, onClick}) => {
	return (
		<Avatar
			size={size}
			name={icon}
			classNames={{
				base: `${iconBackground}`,
				name: 'text-3xl'
			}}
			color="default"
			style={{
				marginLeft: 'auto',
				marginRight: 'auto'
			}}
			onClick={onClick}
		/>
	)
}