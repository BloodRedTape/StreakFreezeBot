import { Button, Checkbox, IconButton, Section, Text } from "@xelene/tgui";
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close";
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit";
import { CSSProperties, useState } from "react";
import { Entry } from "../core/Entry";
import { StreakType } from "../core/Streak";
import { FetchUserContext, ProtectionType, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { ErrorPopupFromJson, FetchPendingSubmition, GetPostMessageContent, GetPostMessageType, JsonFromResp, PostCommit, PostMessageType, PostPendingSubmition } from "../helpers/Requests";
import { GetCalendarStatImageLinkFor } from "../helpers/Resources";
import { ExtendedStreakModal } from "./ExtendedStreak";
import { Img } from "../core/Img";
import { ExtendedType, ParseExtendedType } from "../core/Extended";
import { useNavigate } from "react-router";
import { Header } from "../core/Header";

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

export const EntryText: React.FC<{ text: string}> = ({text}) => (
	<Text weight="3" style={{ marginLeft: '5px', textAlign: 'justify' }}>{text}</Text>
)	

const StreakUsage = () => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const [fetched, setFetched] = useState(false)
	const [toCommit, setToCommit] = useState<number[]>([])
	const [extended, setExtended] = useState<ExtendedType>()
	const navigate = useNavigate()

	if (!fetched) {
		FetchPendingSubmition()
			.then((pending) => setToCommit(pending.concat(toCommit)))
			.finally(() => setFetched(true))
	}

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const MakeStreakEntry = (streak: StreakType) => {
		if (!userContext)
			return (<div></div>)

		const IsCommited = streak.ProtectionAt(userContext.Today) == ProtectionType.Commit
		const IsFreezed = streak.ProtectionAt(userContext.Today) == ProtectionType.Freeze
		const CanCommit = !IsCommited
		
		const IsCheck = () => {
			return streak.ProtectionAt(userContext.Today) == ProtectionType.Commit || toCommit.includes(streak.Id)
		}

		const SetCheck = (check: boolean) => {
			const newArray = check ? toCommit.concat([streak.Id]) : toCommit.filter(e => e !== streak.Id)

			setToCommit(newArray)
			PostPendingSubmition(newArray)
		}

		const Box = IsCheck()
			? (<Checkbox checked disabled={!CanCommit} onChange={e => SetCheck(e.target.checked)} />)
			: (<Checkbox disabled={!CanCommit} onChange={e => SetCheck(e.target.checked)} />)

		const FreezeIcon = (
			<Img
				style={{ width: '40px', height: '40px', padding: '5px'}}
				src={GetCalendarStatImageLinkFor(ProtectionType.Freeze)}
			/>
		)

		const OnOpen = () => {
			if (streak.Challenge)
				navigate('/challenge/' + streak.Challenge)
			else
				navigate('/streak/' + streak.Id)
		}

		return (
			<Entry
				before={<div style={AlignCenterStyle}>{Box}</div>}
				after={IsFreezed ? FreezeIcon : <IconButton style={{ visibility: 'hidden' }} size='s' mode='plain' disabled={true} ><Icon28Close /></IconButton>}
				style={{ paddingLeft: '10px' }}
				onContentClick={OnOpen}
			>
				<EntryText
					text={streak.Description}
				/>
			</Entry>
		)
	}

	const MakeSection = (name: string, streaks: StreakType[], challenge: boolean = false) => {
		const EntriesStyle: CSSProperties = {
			paddingTop: '5px',
			paddingBottom: '5px',
		}

		const ShowName = challenge ? streaks.length > 1 : streaks.length > 0

		return (
			<div>
				{ShowName ? <Text weight="3">{name}</Text> : null}
				<Section style={EntriesStyle}>
					{streaks.map(MakeStreakEntry)}
				</Section>
			</div>
		)
	}

	const Streaks = (userContext?.Streaks ?? []).filter(s => !s.IsChallenge())
	const ChallengeStreaks = (userContext?.Streaks ?? []).filter(s => s.IsChallenge())

	const ChallengesMap = new Map<number, Array<StreakType>>()

	ChallengeStreaks.forEach(s => {
		if (!ChallengesMap.has(s.Challenge))
			ChallengesMap.set(s.Challenge, [s])
		else
			ChallengesMap.get(s.Challenge)?.push(s)
	})

	const Challenges = userContext?.Challenges ?? []

	const ChallengeName = (id: number) => {
		return Challenges.find(c => c.Id === id)?.Name ?? ""
	}

	const HandleCommitResult = (json: any) => {
		const type = GetPostMessageType(json)

		if(type === PostMessageType.Fail)
			return ErrorPopupFromJson(json)

		if (type !== PostMessageType.Data)
			return

		const data = GetPostMessageContent(json)

		setExtended(ParseExtendedType(data))
	}

	const OnCommit = () => {
		if (!toCommit.length)
			return

		PostCommit(toCommit)
			.then(JsonFromResp)
			.then(HandleCommitResult)
			.then(Refresh)
		setToCommit([])
	}

	const CommitButton = (
		<Button
			size="l"
			disabled={!toCommit.length}
			stretched
			mode="filled"
			onClick={OnCommit}
		>
			Commit
		</Button>
	)

	return (
		<div>
			<ExtendedStreakModal
				count={userContext?.Streak ?? 0}
				extended={extended !== undefined}
				comment={extended?.Comment ?? 'Extend your streak!'}
				show={ extended?.Show ?? [] }
				onExtendedFinish={() => setExtended(undefined)}
				challenges={userContext?.GetRunningChallenges() || [] }
			/>
			<Header
				title={"Streaks"}
				actions={[
					{
						icon: <div/>,
						text: "Freezes",
						onAction: () => navigate('/edit_freezes')
					},
					{
						icon: <Icon28Edit />,
						text: "",
						onAction: () => navigate('/edit_streaks')
					},
				]}
			/>
			{MakeSection("Required", Streaks.filter(s=>s.IsRequired()))}
			{MakeSection("Optional", Streaks.filter(s => s.IsOptional()))}
			<Header
				title={"Challenges"}
				actions={[
					{
						icon: <Icon28Edit />,
						text: "",
						onAction: () => navigate('/edit_challenges')
					}
				]}
			/>
			{
				Array.from(ChallengesMap.entries()).map(c => {
					return MakeSection(ChallengeName(c[0]), c[1], true)
				})
			}
			{CommitButton }
		</div>
	)
}

export const CommitSection = () => {
	return (
		<div>
			<StreakUsage/>
		</div>
	)
};
