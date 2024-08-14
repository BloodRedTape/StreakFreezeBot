import { useState } from "react";
import { ProtectionType, useUserContext } from "../core/UserContext";
import { CalendarWithSelector, GetAnchorDate, MonthStats } from "./Calendar";

export const CalendarSection = () => {
	const [userContext] = useUserContext()
	let [anchor, setAnchor] = useState(GetAnchorDate())

	let stats = Object.entries({
		'Commited': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Commit) ?? 0,
		'Freezed': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Freeze) ?? 0
	})

	
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