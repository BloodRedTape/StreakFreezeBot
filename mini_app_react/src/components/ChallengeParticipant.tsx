import { Text, Section, Avatar, Cell } from "@xelene/tgui"
import { useQuery } from "react-query"
import { ChallengeParticipantType, ChallengeWithPayloadType } from "../core/Challenge"
import { FetchChallengeParticipants, GatherCurrentUserId, ProfilePhotoUrlFor } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"
import { ChallengeParticipantProgress } from "./ChallengeParticipantProgress"

const ChallengeParticipant: React.FC<{ participant: ChallengeParticipantType, challenge: ChallengeWithPayloadType }> = ({ participant, challenge }) => {

	const Icon = (
		<Avatar
			size={48}
			src={ProfilePhotoUrlFor(participant.Id)}
		/>
	)

	const commitedToday = participant.Count === challenge.DayOfChallenge + 1

	const isYou = GatherCurrentUserId() === participant.Id

	const Progress = (
		<ChallengeParticipantProgress
			count={participant.Count}
			duration={challenge.Duration}
			hasLost={participant.HasLost}
			commited={commitedToday}
			compact={true}
		/>
	)

	return (
		<Cell
			before={Icon}
			subtitle={Progress}
			style={{background: ForegroundColor()}}
		>
			<Text
				weight={isYou ? "2" : "3"}
			>
				{ participant.FullName }
			</Text>
		</Cell>
	)
}

export const ChallengeParticipantList: React.FC<{ challenge: ChallengeWithPayloadType }> = ({ challenge }) => {
	const { error, isLoading, data } = useQuery(['challenge', challenge.Id], () => FetchChallengeParticipants(challenge.Id))

	const ErrorCell = (
		<Cell
			style={{background: ForegroundColor()}}
		>
			<Text weight="3">Failed to load participants</Text>
		</Cell>
	)

	const LoadingCell = (
		<Cell
			style={{background: ForegroundColor()}}
		>
			<Text weight="3">Loading...</Text>
		</Cell>
	)

	const ParticipantCompare = (left: ChallengeParticipantType, right: ChallengeParticipantType) => {
		return right.Count - left.Count
	}

	const ParticipantCells = (data ?? []).sort(ParticipantCompare).map((participant) =>
		(<ChallengeParticipant participant={participant} challenge={challenge} />)
	)

	const Content = error ? ErrorCell : isLoading ? LoadingCell : ParticipantCells

	return (
		<div>
			<Section style={{paddingTop: '10px'}}>
				{ Content }					
			</Section>
		</div>
	)
}