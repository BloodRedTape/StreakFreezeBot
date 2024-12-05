import { Text } from "@telegram-apps/telegram-ui"
import { StreakType } from "../core/Streak"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { ErrorPopupFromJson, JsonFromResp, PostAddStreak, PostRemoveStreak } from "../helpers/Requests"
import { ToDoEdit, ToDoEntry } from "./ToDoEdit"


export const StreakEdit = () => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const Streaks = userContext?.Streaks.filter(streak => streak.Challenge === 0) || []

	const StreakToEntry = (streak: StreakType): ToDoEntry => {
		const entry: ToDoEntry = {
			Id: streak.Id,
			Name: streak.Description,
			Removable: !streak.HasEverProtected()
		}

		return entry
	}

	const Entries = Streaks.map(StreakToEntry)

	const OnAddEntry = (entry: string) => {
		PostAddStreak([entry]).then(JsonFromResp).then(ErrorPopupFromJson).then(Refresh)
	}

	const OnRemoveEntry = (entry: ToDoEntry) => {
		PostRemoveStreak([entry.Id]).then(JsonFromResp).then(ErrorPopupFromJson).then(Refresh)
	}

	return (
		<div style={{ paddingLeft: '5%', paddingRight: '5%'}}>
			<Text weight="2">{'Streaks'}</Text>
			<div style={{ paddingTop: '5px' }}>
				<ToDoEdit
					entries={Entries}
					addEntry={OnAddEntry}
					removeEntry={OnRemoveEntry }
				/>
			</div>
		</div>

	)
}
