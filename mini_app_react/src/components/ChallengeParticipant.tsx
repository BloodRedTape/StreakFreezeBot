import { Listbox, ListboxItem } from "@nextui-org/react"
import { Text } from "@telegram-apps/telegram-ui"
import { useQuery } from "react-query"
import { ChallengeParticipantType, ChallengeWithPayloadType } from "../core/Challenge"
import { FetchChallengeParticipants, GatherCurrentUserId } from "../helpers/Requests"
import { ChallengeParticipantProgress } from "./ChallengeParticipantProgress"
import { ProfileAvatar } from "./ProfileAvatar"

const MakeChallengeParticipant = (participant: ChallengeParticipantType, challenge: ChallengeWithPayloadType) => {
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
		<ListboxItem
			startContent={<ProfileAvatar id={participant.Id} username={participant.Username} />}
			description={challenge.IsPending() ? undefined : Progress}
			key={participant.FullName}
		>
			<Text
				weight={isYou ? "2" : "3"}
			>
				{ participant.FullName }
			</Text>
		</ListboxItem>
	)
}

export const ChallengeParticipantList: React.FC<{ challenge: ChallengeWithPayloadType }> = ({ challenge }) => {
	const { isError, isLoading, data } = useQuery(['challenge_participants', challenge.Id], () => FetchChallengeParticipants(challenge.Id))

	const ErrorCell = (
		<Text weight="3">Failed to load participants</Text>
	)

	const LoadingCell = (
		<Text weight="3">Loading...</Text>
	)

	const ParticipantCompare = (left: ChallengeParticipantType, right: ChallengeParticipantType) => {
		return right.Count - left.Count
	}

	type ParticipantEntry = {
		challenge: ChallengeWithPayloadType,
		participant: ChallengeParticipantType
	}

	const entries = (data ?? []).sort(ParticipantCompare).map((participant): ParticipantEntry => {
		return {
			challenge: challenge,
			participant: participant
		}
	})

	if (isError)
		return ErrorCell;

	if (isLoading)
		return LoadingCell;

	return (
			<Listbox
				items={entries}
				className="bg-content2 rounded-small"
				emptyContent={<div />}
				itemClasses={{ base: "h-16" }}
				shouldHighlightOnFocus={false}
			>
				{(entry) => MakeChallengeParticipant(entry.participant, entry.challenge)}
			</Listbox>
	)
}