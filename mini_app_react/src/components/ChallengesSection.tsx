import { Avatar, Button, Cell, Section, Text } from "@xelene/tgui"
import { ChallengeWithPayloadType } from "../core/Challenge"
import { useGetUserContext } from "../core/UserContext"
import { PlaceholderUrlFor } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"
import { useNavigate } from "react-router"

const NewChallengeModal = () => {

	const navigation = useNavigate()

	const OnNewChallenge = () => {

		navigation('/new_challenge')
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
			navigate('/challenge/' + challenge.Id)
		}

		const Icon = (
			<Avatar
				size={48}
				src={PlaceholderUrlFor(challenge.Name)}
				fallbackIcon="https://avatars.githubusercontent.com/u/84640980?v=4"
			/>
		)

		const Entry = (
			<Cell
				before={Icon}
				after={<Text weight="2">{challenge.Participants.length}</Text>}
				subtitle={"Do your best!"}
				style={{ background: ForegroundColor() }}
				onClick={OnNavigateChallenge }
			>
				{ challenge.Name }
			</Cell>
		)

		return Entry
	}

	const MakeChallengeSection = (name: string, challenges: ChallengeWithPayloadType[]) => {
		if (!challenges.length)
			return null

		const Challenges = challenges.map(MakeChallengeEntry)

		return (
			<div
				style={{paddingTop: '10px', paddingBottom: '10px'}}
			>
				<Text weight="3">{ name }</Text>
				<Section>
					{ Challenges }
				</Section>
			</div>
		)
	}

	const Running = userContext?.Challenges?.filter(c => c.IsRunning(userContext?.Today)) ?? []
	const Pending = userContext?.Challenges?.filter(c => c.IsPending(userContext?.Today)) ?? []
	const Finished = userContext?.Challenges?.filter(c=> !Running.includes(c) && !Pending.includes(c)) ?? []

	return (
		<div>
			{Header}
			{ MakeChallengeSection('Running', Running) }
			{ MakeChallengeSection('Pending', Pending) }
			{ MakeChallengeSection('Finished', Finished) }
		</div>
	)
}