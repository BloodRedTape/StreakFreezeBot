﻿import { List, Text, Blockquote, Title } from '@telegram-apps/telegram-ui';
import { useUserContext } from '../core/UserContext';
import { CalendarSection } from './CalendarSection';
import { GatherUserCompleteName, GetQuote } from '../helpers/Requests';
import { useState } from 'react';
import { useCookies } from 'react-cookie';
import WebApp from '@twa-dev/sdk'
import { Loader } from '../core/Loader';

export const StreakSection = () => {
	const [userContext] = useUserContext()
	const [quoteState, setQuoteState] = useState<string>()
	const [quoteCookies, setQuoteCookies] = useCookies(['Quote'])

	if (userContext == undefined) {
		return (
			<div style={{paddingTop: '40%'}}>
				<Loader text="Loading user data..." />
			</div>
		)
	}

	const quote: string = quoteState ?? quoteCookies.Quote ?? 'There is a way...'

	if (quoteState === undefined) {
		GetQuote().then((quote) => {
			setQuoteCookies('Quote', quote)
			setQuoteState(quote)
		})
	}



	const streakDescription = userContext.HasStreak() ? `Your streak is ${userContext?.StreakSize() ?? 0} days now` : 'No streak?'

	const OnShareQuote = () => {
		const text = `'${quote}' ©️ StreakFreezeBot`
		const link = `https://t.me/share/url?url=${text}`

		WebApp.openTelegramLink(link)
	}

	return (
		<List>
			<List style={{padding: '0 5% 0 5%'} }>
				<Title weight="1" >Hey, { GatherUserCompleteName() }!</Title>
				<Text weight="2">{ streakDescription }</Text>
				<br/>
				<br/>
				<Blockquote type="text" onDoubleClick={OnShareQuote}> { quote } </Blockquote>
			</List>
			<CalendarSection/>
		</List>
	);
}
