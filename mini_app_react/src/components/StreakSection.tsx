import { List, Text, Divider, Blockquote } from '@xelene/tgui';
import { useUserContext } from '../core/UserContext';
import { Background } from '../core/Background';
import { CalendarSection } from './CalendarSection';

export const StreakSection = () => {
	const [userContext] = useUserContext()

	if (userContext == undefined)
		return (<Background><Text style={{margin: '20%'}} weight="1">Ops, can't fetch a user!</Text></Background>)

	let quote = 'There is nothing better than extending your streak!'

	return (
		<List>
			<Text weight="2">Streak</Text>
			<br/>
			<Text weight="3">{ userContext?.Days ?? 0 } days</Text>
			<br/>
			<br/>
			<Blockquote type="text"> { quote } </Blockquote>
			<Divider />
			<CalendarSection/>
		</List>
	);
}
