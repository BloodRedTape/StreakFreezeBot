import { List, Text } from "@xelene/tgui";
import { useGetUserContext } from "../core/UserContext";
import { AddFreezeModal } from "./AddFreeze";
import { Freeze } from "./Freeze";

export const FreezeSection = () => {

	const userContext = useGetUserContext()

	const FreezesList = (
		<List>
			{userContext?.AvailableFreezes.map((freeze) =>
				<Freeze freeze={userContext?.Freezes[freeze]} id={freeze} />)
			}
		</List>
	)

	return (
		<List>
			<div style={{margin: '10px'}}>
				<Text weight="2">Freezes</Text>
				<br/>
				<Text weight="3" style={{margin: '0px 10px'} }>Equipped { userContext?.AvailableFreezes.length ?? 0 }/{ userContext?.MaxFreezes ?? 0}</Text>
				<AddFreezeModal/>
			</div>
			<br />
			{FreezesList}
		</List>
	)
}