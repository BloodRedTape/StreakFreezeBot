import { Text } from "@telegram-apps/telegram-ui";
import { useGetUserContext } from "../core/UserContext";
import { AddFreezeModal } from "./AddFreeze";
import { Freeze } from "./Freeze";

export const FreezeSection = () => {

	const userContext = useGetUserContext()

	const FreezesList = (
		<div>
			{userContext?.AvailableFreezes.map((freeze) =>
				<Freeze freeze={userContext?.Freezes[freeze]} id={freeze} />)
			}
		</div>
	)

	return (
		<div>
			<div>
				<Text weight="2">Freezes</Text>

				<div style={{display: 'flex', alignItems: 'center'}}>
					<Text weight="3">
						Equipped {userContext?.AvailableFreezes.length ?? 0}/{userContext?.MaxFreezes ?? 0}
					</Text>
					<AddFreezeModal/>
				</div>
			</div>
			{FreezesList}
		</div>
	)
}

export const FreezePage = () => {
	return (
		<div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
			<FreezeSection/>
		</div>
	)
}