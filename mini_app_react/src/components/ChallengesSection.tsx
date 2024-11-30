import { Avatar, Button, Text } from "@xelene/tgui"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { useGetUserContext } from "../core/UserContext"
import { PlaceholderUrlFor } from "../helpers/Requests"
import { useNavigate } from "react-router"
import { Listbox, ListboxItem } from "@nextui-org/react"
import { ListPlaceholder } from "../core/ListPlaceholder"

const NewChallengeModal = () => {

	const navigation = useNavigate()

	const OnNewChallenge = () => {

		navigation('/edit_challenges/new_challenge')
	}

	const NewChallengeButton = (
		<Button
			size='s'
			mode='bezeled'
			style={{ marginLeft: 'auto', marginRight: '5px' }}
			onClick={OnNewChallenge}
		>
			<Text weight="3">New</Text>
		</Button>
	)

	return NewChallengeButton;
}

export const ChallengesSection = () => {
	const userContext = useGetUserContext()
	const navigate = useNavigate()

	const Header = (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">{'Challenges'}</Text>
			<NewChallengeModal/>
		</div>
	)

	const MakeChallengeEntry = (challenge: ChallengeWithPayloadType) => {
		const OnNavigateChallenge = () => {
			navigate('/edit_challenges/challenge/' + challenge.Id)
		}

		const Icon = (
			<Avatar
				size={48}
				src={PlaceholderUrlFor(challenge.Name)}
			/>
		)

		return (
			<ListboxItem
				key={challenge.Name}
				startContent={Icon}
				endContent={<Text weight="2">{challenge.Participants.length}</Text>}
				description={"Do your best!"}
				onClick={OnNavigateChallenge }
			>
				{ challenge.Name }
			</ListboxItem>
		)
	}

	const MakeChallengeSection = (name: string, challenges: ChallengeWithPayloadType[]) => {
		if (!challenges.length)
			return null

		return (
			<div
				style={{paddingTop: '10px', paddingBottom: '10px'}}
			>
				<Text weight="3">{ name }</Text>
				<Listbox
					items={challenges}
					className="bg-content2 rounded-small"
					emptyContent={<div />}
					itemClasses={{ base: "h-16" }}
					shouldHighlightOnFocus={false}
				>
					{ MakeChallengeEntry }
				</Listbox>
			</div>
		)
	}

	const Running = userContext?.Challenges?.filter(c => c.IsRunning()) ?? []
	const Pending = userContext?.Challenges?.filter(c => c.IsPending()) ?? []
	const Finished = userContext?.Challenges?.filter(c => c.IsFinished()) ?? []

	const Placeholder = <ListPlaceholder text={"You don't have a challenge yet, create or join now!"}/>

	return (
		<div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
			{ Header }
			{ MakeChallengeSection('Running', Running) }
			{ MakeChallengeSection('Pending', Pending) }
			{ MakeChallengeSection('Finished', Finished) }
			{ !Running.length && !Pending.length && !Finished.length ? Placeholder : undefined }
		</div>
	)
}