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
			Value: userContext?.CountProtectionsInMonth(anchor, ProtectionType.Commit) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Commit)
		},
		{
			Name: 'Freezed',
			Value: userContext?.CountProtectionsInMonth(anchor, ProtectionType.Freeze) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Freeze)
		}
	]
	
	return (
		<CalendarWithSelector
			history={userContext?.History ?? []}
			start={userContext?.StreakStart ?? anchor}
			today={anchor}
			onDateChanged={setAnchor}
			afterSelector={<MonthStats stats={stats} />}
		/>
	)
}