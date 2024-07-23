import { List, Text, Blockquote, Title } from '@xelene/tgui';
import { useUserContext } from '../core/UserContext';
import { CalendarSection } from './CalendarSection';
import { GatherUserCompleteName, GetQuote } from '../helpers/Requests';
import { useState } from 'react';
import { Loading } from './Loading';

export const StreakSection = () => {
	const [userContext] = useUserContext()

	const [quote, setQuote] = useState<string>()

	if (userContext == undefined)
		return (<Loading/>)

	if (quote == undefined)
		GetQuote().then(setQuote)



	const streakDescription = userContext.HasStreak() ? `Your streak is ${ userContext?.StreakSize() ?? 0 } days now` : 'No streak?'

	return (
		<List>
			<List style={{padding: '0 5% 0 5%'} }>
				<Title weight="1" >Hey, { GatherUserCompleteName() }!</Title>
				<Text weight="2">{ streakDescription }</Text>
				<br/>
				<br/>
				<Blockquote type="text"> { quote ?? 'There is the way....' } </Blockquote>
			</List>
			<CalendarSection/>
		</List>
	);
}
