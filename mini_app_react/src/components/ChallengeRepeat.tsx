import { useParams } from "react-router"
import { useGetUserContext } from "../core/UserContext"
import { Text } from "@telegram-apps/telegram-ui"
import { ChallengeInput } from "./ChallengeInput"


export const ChallengeRepeat = () => {
	const { id } = useParams()
	const userContext = useGetUserContext()

	if (id === undefined)
		return (<Text weight="2">Internal error, supply challenge id</Text>)


	const challenges = userContext?.Challenges.filter(c => c.Id === Number(id)) ?? []

	if(challenges.length !== 1)
		return (<Text weight="2">Internal error, invalid challenge id</Text>)

	const challenge = challenges[0];

	return <ChallengeInput initial={{name: challenge.Name, icon: challenge.Icon, iconBackground: challenge.IconBackground, duration: challenge.Duration, toDo: challenge.ToDo} }/>
}