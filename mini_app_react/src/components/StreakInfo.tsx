import { Title, Text } from "@xelene/tgui"
import { useState } from "react"
import { useParams } from "react-router"
import { StreakType } from "../core/Streak"
import { ProtectionType, useGetUserContext } from "../core/UserContext"
import { GetCalendarStatImageLinkFor } from "../helpers/Resources"
import { CalendarWithSelector, GetAnchorDate, MonthStats, StatEntryType } from "./Calendar"


const StreakInfo: React.FC<{ streak: StreakType }> = ({ streak }) => {
	let [anchor, setAnchor] = useState(GetAnchorDate())

	const stats: StatEntryType[] = [
		{
			Name: 'Commited',
			Value: streak.CountProtectionsInMonth(anchor, ProtectionType.Commit) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Commit)
		},
		{
			Name: 'Freezed',
			Value: streak.CountProtectionsInMonth(anchor, ProtectionType.Freeze) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Freeze)
		}
	]
	
	return (
		<div style={{paddingBottom: '10%', paddingLeft: '10px', paddingRight: '10px'}}>
			<div style={{ padding: '5%' }}>
				<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
					<Title weight="1">Streak '{streak.Description}'</Title>
				</div>
				<br/>
				<Text weight="2">{streak.Count ? `Is ${streak.Count} days long` : 'Is inactive now, commit to activate it'}</Text>
				<br/>
			</div>
			<CalendarWithSelector
				today={anchor}
				onDateChanged={setAnchor}
				afterSelector={
					<MonthStats stats={stats} />
				}
				history={streak.History}
				start={streak.Start}
			/>
		</div>
	)
}

export const StreakInfoPage = () => {
	const { id } = useParams()
	const userContext = useGetUserContext()

	if (id === undefined)
		return (<Text weight="2">Internal error, supply streak id</Text>)

	const numId = Number(id)

	if(userContext === undefined || numId >= userContext.Streaks.length)
		return (<Text weight="2">Internal error, invalid streak id</Text>)

	return (<StreakInfo streak={userContext.Streaks[numId]}/>)
}
