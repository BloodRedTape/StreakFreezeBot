import { Banner, List, Text, Breadcrumbs, Divider, Blockquote, IconButton} from '@xelene/tgui';
import { BreadCrumbsItem } from '@xelene/tgui/dist/components/Navigation/Breadcrumbs/components/BreadCrumbsItem/BreadCrumbsItem';
import { useState } from 'react';
import { useStreakContext } from '../core/StreakContext';
import { Calendar } from './Calendar';
import { Icon24ChevronLeft } from '@xelene/tgui/dist/icons/24/chevron_left';
import { Icon24ChevronRight } from '@xelene/tgui/dist/icons/24/chevron_right';

const AdvanceMonth = (date: Date, months: number) => {
    const newDate = new Date(date.getTime());

    const currentMonth = newDate.getMonth();
    const currentYear = newDate.getFullYear();
    const totalMonths = currentMonth + months;
    
    const targetYear = currentYear + Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12;

    newDate.setFullYear(targetYear);
    newDate.setMonth(targetMonth);

    if (newDate.getMonth() !== targetMonth % 12) {
        newDate.setDate(0);
    }

	return newDate;
}

const GetCommitedAt = (date: Date) => {
	return Math.floor(Math.random() * date.getDay())
}

const GetFreezedAt = (date: Date) => {
	return Math.floor(Math.random() * date.getDay())
}

export const StreakSection = () => {
	const [streakContext] = useStreakContext()

	let quote = 'There is nothing better than extending your streak!'
	const monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	let [anchor, setAnchor] = useState(new Date(2024, 7, 0))

	let monthIndex = anchor.getMonth()
	let month = monthIndex + 1
	let year = anchor.getFullYear()
	let monthName = monthNames[monthIndex]

	let stats = Object.entries({
		'Commited': GetCommitedAt(anchor),
		'Freezed': GetFreezedAt(anchor)
	})

	return (
		<Banner header="Streak">
			<List>
				<Text weight="3">{ streakContext.Days } days</Text>
				<br />
				<br />
				<Blockquote type="text"> { quote } </Blockquote>
				<Divider />
				<div style={{ display: 'inline' }}>
					<Text weight="2">{monthName} {year}</Text>
					<IconButton style={{float: 'right'}} size="s" onClick={ ()=>setAnchor(AdvanceMonth(anchor, 1)) }><Icon24ChevronRight/></IconButton>
					<IconButton style={{marginRight: '10px', float: 'right'}} size="s" onClick={ ()=>setAnchor(AdvanceMonth(anchor,-1)) }><Icon24ChevronLeft/></IconButton>
				</div>
				<br />
				<br />
				<Breadcrumbs>
					{
						stats.map((pair) => 
							(<BreadCrumbsItem>
								<List>
									<Text weight="2">{pair[0]}</Text>
									<br />
									<Text weight="3">{pair[1]} Days</Text>
								</List>
							</BreadCrumbsItem>)
						)
					}
				</Breadcrumbs>
				<Calendar year={year} month={month}/>
			</List>
		</Banner>
	);
}
