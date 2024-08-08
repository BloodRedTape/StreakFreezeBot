import { Avatar, Blockquote, Button, IconButton, Modal, Text} from "@xelene/tgui"
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close"
import { useState } from "react"
import { Entry } from "../core/Entry"
import { FriendType } from "../core/Friend"
import { ProtectionType, useGetUserContext } from "../core/UserContext"
import { PostNudge, ProfilePhotoUrl } from "../helpers/Requests"

type Quote = {
	Emoji: string
	Text: string
}

const MakeQuoteText = (quote: Quote) => {
	return quote.Emoji + ' ' + quote.Text
}

const GetQuoteList = (streak: number, today: boolean, friend: FriendType): Array<Quote> => {
	if (friend.Streak === 0) {
		if (streak !== 0)
			return [
				{ Emoji: "😎", Text: "Hey, still no streak? Join me!" },
				{ Emoji: "😡", Text: "Are you gay? then why no streak, Join me!" },
				{ Emoji: "💅", Text: "Real besties honor streak, join me!" },
				{ Emoji: "🇺🇸", Text: "I'm stronger, i'm smarter, i'm better" }
			];
		else
			return [
				{ Emoji: "😎", Text: "Hey, still no streak?" },
				{ Emoji: "😡", Text: "Are you gay? then why no streak!" },
				{ Emoji: "💅", Text: "Real besties honor streak!" },
				{ Emoji: "😡", Text: "So unfortunate to have a friend without a streak!" }
			];
	} else if (friend.TodayProtection !== ProtectionType.None){
		if(today)
			return [
				{ Emoji: "😈", Text: "It would be gay not to commit today!" },
				{ Emoji: "😎", Text: "We've both commited today, cool!" },
				{ Emoji: "🤝", Text: "Team work goes brrrr!" },
				{ Emoji: "💅", Text: "We are awasome!" }
			];
		else
			return [
				{ Emoji: "💅", Text: "Protected streak, great!" },
				{ Emoji: "🦅", Text: "You're stronger, you're smarter, you're better!" },
				{ Emoji: "😎", Text: "You rook, dude! Not as much as me though..." },
				{ Emoji: "😏", Text: "I am the only gay here!" }
			];
	} else {
		if(today)
			return [
				{ Emoji: "😈", Text: "It would be gay not to commit today!" },
				{ Emoji: "🤩", Text: "I've already commited today, join me!" },
				{ Emoji: "🌷", Text: "People who commit get girls or wherever!" },
				{ Emoji: "👹", Text: "Commit or get nuked!" },
			];
		else
			return [
				{ Emoji: "🥰", Text: "Let's commit together!!!!" },
				{ Emoji: "😭", Text: "Wanna throw away your streak?" },
				{ Emoji: "😇", Text: "We are such a late commiters" },
				{ Emoji: "🤮", Text: "Whoever breaks the streak is a loser." },
			];
	}
	
}

const NudgeModal: React.FC<{ friend: FriendType }> = ({ friend }) => {
	const userContext = useGetUserContext()

	const quotes = GetQuoteList(userContext?.Streak ?? 0, userContext?.ProtectionAt(userContext?.Today) !== ProtectionType.None ?? false, friend)
	const [quote, setQuote] = useState(0)

	const OnNudge = () => {
		PostNudge(friend.Id, MakeQuoteText(quotes[quote]))
	}

	const NudgeButton = (
		//<Modal.Close>
			<Button
				stretched
				onClick={OnNudge}
			>
				Send nudge to {friend.FullName }!
			</Button>
		//</Modal.Close>
	)

	const CloseButton = (
		<Modal.Close>
			<IconButton
				size='s'
				mode='plain'
			>
				<Icon28Close />
			</IconButton>
		</Modal.Close>
	)

	const QuoteButtons = quotes.map((quote, index)=>{
		return (
			<Button size='m' mode='outline' onClick={() => setQuote(index)}>
				<span role="img" aria-label="emoji">{quote.Emoji}</span>
			</Button>
		)	
	})

	return (
		<div style={{ padding: '5%' }}>
			<Entry
				after={CloseButton}
			>
				<Text weight="2">Send Nudge</Text>
			</Entry>

			<div style={{display: 'flex', alignItems: 'center'}}>
				<Blockquote style={{ marginLeft: '0px', marginRight: '5%' }} >
					{MakeQuoteText(quotes[quote])}
				</Blockquote>
				<Avatar
					src={ProfilePhotoUrl()}
				/>
			</div>

			<div style={{ marginTop: '5%', marginBottom: '5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				{QuoteButtons}
			</div>

			<div style={{ paddingTop: '5%', paddingBottom: '15%' }}>
				{NudgeButton}
			</div>
		</div>
	)
}

export const NudgeButton: React.FC<{ friend: FriendType }> = ({ friend }) => {
	const CanNudge = true

	const OpenModalButton = (<Button size="s" disabled={!CanNudge}>Nudge</Button>)


	return (
		<Modal
			trigger={OpenModalButton}
			style={{background: 'var(--tg-theme-header-bg-color)'} }
		>
			<NudgeModal friend={friend}/>
		</Modal>
	)
}
