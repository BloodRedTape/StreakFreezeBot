import { Banner, List, Text, Breadcrumbs, Divider, Blockquote, IconButton} from '@xelene/tgui';
import { BreadCrumbsItem } from '@xelene/tgui/dist/components/Navigation/Breadcrumbs/components/BreadCrumbsItem/BreadCrumbsItem';
import { useState } from 'react';
import { ProtectionType, useUserContext } from '../core/UserContext';
import { Calendar } from './Calendar';
import { Icon24ChevronLeft } from '@xelene/tgui/dist/icons/24/chevron_left';
import { Icon24ChevronRight } from '@xelene/tgui/dist/icons/24/chevron_right';
import { addMonths } from 'date-fns';

const GetAnchorDate = () => {
	const date = new Date(Date.now())

	return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const StreakSection = () => {
	const [userContext] = useUserContext()

	let quote = 'There is nothing better than extending your streak!'
	const monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	let [anchor, setAnchor] = useState(GetAnchorDate())

	let monthIndex = anchor.getMonth()
	let month = monthIndex + 1
	let year = anchor.getFullYear()
	let monthName = monthNames[monthIndex]

	let stats = Object.entries({
		'Commited': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Commit),
		'Freezed': userContext?.CountProtectionsInMonth(anchor, ProtectionType.Freeze)
	})

	return (
		<Banner header="Streak">
			<List>
				<Text weight="3">{ userContext?.Days } days</Text>
				<br />
				<br />
				<Blockquote type="text"> { quote } </Blockquote>
				<Divider />
				<div style={{ display: 'inline' }}>
					<Text weight="2">{monthName} {year}</Text>
					<IconButton style={{float: 'right'}} size="s" onClick={ ()=>setAnchor(addMonths(anchor, 1)) }><Icon24ChevronRight/></IconButton>
					<IconButton style={{marginRight: '10px', float: 'right'}} size="s" onClick={ ()=>setAnchor(addMonths(anchor,-1)) }><Icon24ChevronLeft/></IconButton>
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
