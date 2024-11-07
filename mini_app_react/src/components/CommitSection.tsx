import { Button, Checkbox, Text } from "@xelene/tgui";
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit";
import { CSSProperties, useState } from "react";
import { StreakType } from "../core/Streak";
import { FetchUserContext, ProtectionType, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { ErrorPopupFromJson, FetchPendingSubmition, GetPostMessageContent, GetPostMessageType, JsonFromResp, PostCommit, PostMessageType, PostPendingSubmition } from "../helpers/Requests";
import { GetCalendarStatImageLinkFor } from "../helpers/Resources";
import { ExtendedStreakModal } from "./ExtendedStreak";
import { Img } from "../core/Img";
import { ExtendedType, ParseExtendedType } from "../core/Extended";
import { useNavigate } from "react-router";
import { Header } from "../core/Header";
import { Listbox, ListboxItem } from "@nextui-org/react";

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

export const EntryText: React.FC<{ text: string}> = ({text}) => (
	<Text weight="3" style={{ marginLeft: '5px', textAlign: 'justify' }}>{text}</Text>
)	

type SetToCommit = (to: number[]) => void;

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

	const MakeStreakEntry = (streak: StreakType, toCommit: number[], setToCommit: SetToCommit) => {
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
			<ListboxItem
				key={streak.Description}
				endContent={IsFreezed ? FreezeIcon : undefined}
				startContent={<div style={AlignCenterStyle}>{Box}</div>}
			>
				<div onClick={OnOpen}>
					{streak.Description}
				</div>
			</ListboxItem>
		)
	}

	const MakeSection = (name: string, streaks: StreakType[], toCommit: number[], setToCommit: SetToCommit, challenge: boolean = false) => {
		const ShowName = challenge ? streaks.length > 1 : streaks.length > 0

		if (!streaks.length)
			return undefined

		type StreakEntry = {
			streak: StreakType,
			toCommit: number[],
			setToCommit: SetToCommit
		}

		const Entries = streaks.map((s): StreakEntry => {
			return {
				streak: s,
				toCommit: toCommit,
				setToCommit: setToCommit
			}
		})

		return (
			<div style={{paddingBottom: '10px'}}>
				{ShowName ? <Text weight="3" style={{paddingBottom: '5px'}}>{name}</Text> : null}
				<Listbox 
					items={Entries}
					className="bg-content2 rounded-small"
					emptyContent={<div />}
					itemClasses={{ base: "h-9" }}
					shouldHighlightOnFocus={false}
				>
					{(entry)=>MakeStreakEntry(entry.streak, entry.toCommit, entry.setToCommit)}
				</Listbox>
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
						icon: <Icon28Edit />,
						text: "",
						onAction: () => navigate('/edit_streaks')
					},
					{
						icon: <div/>,
						text: "Freezes",
						onAction: () => navigate('/edit_freezes')
					}
				]}
			/>
			{MakeSection("Required", Streaks.filter(s=>s.IsRequired()), toCommit, setToCommit)}
			{MakeSection("Optional", Streaks.filter(s => s.IsOptional()), toCommit, setToCommit)}
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
					return MakeSection(ChallengeName(c[0]), c[1], toCommit, setToCommit, true)
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
