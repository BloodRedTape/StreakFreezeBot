import { useState } from "react";
import { ProtectionType, useUserContext } from "../core/UserContext";
import { GetCalendarStatImageLinkFor } from "../helpers/Resources";
import { CalendarWithSelector, GetAnchorDate, MonthStats, StatEntryType,  } from "./Calendar";

export const CalendarSection = () => {
	const [userContext] = useUserContext()
	let [anchor, setAnchor] = useState(GetAnchorDate())

	const stats: StatEntryType[] = [
		{
			Name: 'Commited',
			Value: userContext?.CountTotalProtections(ProtectionType.Commit) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Commit)
		},
		{
			Name: 'Freezed',
			Value: userContext?.CountTotalProtections(ProtectionType.Freeze) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Freeze)
		}
	]
	
	return (
		<div>
			<div style={{
				paddingLeft: '5%',
				paddingRight: '5%'
			}}>
				<MonthStats stats={stats} />
			</div>
			<CalendarWithSelector
				history={userContext?.History ?? []}
				start={userContext?.StreakStart ?? anchor}
				today={anchor}
				onDateChanged={setAnchor}
				afterSelector={<div style={{ paddingTop: '10px' }}/> }
			/>
		</div>
	)
}