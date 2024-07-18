import { List, Text, IconButton, Breadcrumbs } from "@xelene/tgui";
import { addMonths } from "date-fns";
import { useState } from "react";
import { ProtectionType, useUserContext } from "../core/UserContext";
import { Calendar } from "./Calendar";
import { BreadCrumbsItem } from '@xelene/tgui/dist/components/Navigation/Breadcrumbs/components/BreadCrumbsItem/BreadCrumbsItem';
import { Icon24ChevronRight } from "@xelene/tgui/dist/icons/24/chevron_right";
import { Icon24ChevronLeft } from "@xelene/tgui/dist/icons/24/chevron_left";

const GetAnchorDate = () => {
	const date = new Date(Date.now())

	return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const CalendarSection = () => {
	const [userContext] = useUserContext()
	let [anchor, setAnchor] = useState(GetAnchorDate())

	const monthNames = [
		"January", "February", "March", "April", "May", "June(gay)",
		"July", "August", "September", "October", "November", "December"
	];

	let monthIndex = anchor.getMonth()
	let month = monthIndex + 1
	let year = anchor.getFullYear()
	let monthName = monthNames[monthIndex]

	let stats = Object.entries({
		'Commited': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Commit) ?? 0,
		'Freezed': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Freeze) ?? 0
	})

	const MonthSelector = (
		<div style={{ display: 'inline' }}>
			<Text weight="2">{monthName} {year}</Text>
			<IconButton style={{float: 'right'}} size="s" onClick={ ()=>setAnchor(addMonths(anchor, 1)) }><Icon24ChevronRight/></IconButton>
			<IconButton style={{marginRight: '10px', float: 'right'}} size="s" onClick={ ()=>setAnchor(addMonths(anchor,-1)) }><Icon24ChevronLeft/></IconButton>
		</div>
	)

	const MonthStats = (
		<Breadcrumbs>
			{stats.map((pair) => 
				(<BreadCrumbsItem>
					<List>
						<Text weight="2">{pair[0]}</Text>
						<br/>
						<Text weight="3">{pair[1]} Days</Text>
					</List>
				</BreadCrumbsItem>)
			)}
		</Breadcrumbs>
	)

	return (
		<List>
				{ MonthSelector }
				<br/>
				<br/>
				{ MonthStats }
				<Calendar year={year} month={month}/>
		</List>
	)
}