import { Text } from "@xelene/tgui"
import { Avatar, AvatarGroup } from "@nextui-org/react";
import { useQuery } from "react-query";
import { FetchChallengeInviteParticipantsPreview, ProfilePhotoUrlFor } from "../helpers/Requests";

const Status: React.FC<{ text: string }> = ({text}) => {
	return (
		<Text weight="2">{text}</Text>
	)
}

export const ChallengeParticipantPreview: React.FC<{ challenge: number }> = ({ challenge }) => {
    const { isError, isLoading, data } = useQuery(['challenge_preview', challenge], () => FetchChallengeInviteParticipantsPreview(challenge))

    if (isError || data === undefined)
        return <Status text="Can't load participants" />

    if (isLoading)
        return <Status text="Loading participants..." />

    return (
        <AvatarGroup size="md" max={6}>
            {
                data.map(p => {
                    return <Avatar src={ProfilePhotoUrlFor(p.Id) } />
                })
            }
        </AvatarGroup>
  );
}