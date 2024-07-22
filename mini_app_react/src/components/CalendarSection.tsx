import { List, Text, IconButton, Breadcrumbs } from "@xelene/tgui";
import { addMonths } from "date-fns";
import { CSSProperties, useState } from "react";
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

	const SelectorTextStyle: CSSProperties = {
		display: 'inline-block',
		marginTop: 'auto',
		marginBottom: 'auto',
	}

	const SelectorControlsStyle: CSSProperties = {
		display: 'inline-block',
		marginLeft: 'auto',
		marginRight: '0'
	}

	const SelectorStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center'
	}

	const MonthSelector = (
		<div style={SelectorStyle}>
			<Text style={SelectorTextStyle} weight="2">{monthName} {year}</Text>
			<div style={SelectorControlsStyle}>
				<IconButton style={{marginRight: '10px'}} size="s" onClick={ ()=>setAnchor(addMonths(anchor,-1)) }><Icon24ChevronLeft/></IconButton>
				<IconButton size="s" onClick={ ()=>setAnchor(addMonths(anchor, 1)) }><Icon24ChevronRight/></IconButton>
			</div>
		</div>
	)

	const MonthStatsStyle: CSSProperties = {
		display: 'inline-block',
		paddingLeft: 'auto',
		paddingRight: 'auto',
		marginLeft: 'auto',
		marginRight: 'auto',
	}

	const MonthStats = (
		<div style={MonthStatsStyle}>
			<Breadcrumbs >
			{stats.map((pair) => 
				(<BreadCrumbsItem >
					<List>
						<Text weight="2">{pair[0]}</Text>
						<br/>
						<Text weight="3">{pair[1]} Days</Text>
					</List>
				</BreadCrumbsItem>)
			)}
			</Breadcrumbs>
		</div>
	)

	return (
		<div>
			<div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
				{ MonthSelector }
				{ MonthStats }
			</div>
			<Calendar year={year} month={month}/>
		</div>
	)
}