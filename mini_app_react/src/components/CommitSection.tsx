import { Button, Checkbox, IconButton, Input, Modal, Section, Text, Title } from "@xelene/tgui";
import { Icon28AddCircle } from "@xelene/tgui/dist/icons/28/add_circle";
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive";
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close";
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit";
import { CSSProperties, useState } from "react";
import { Entry } from "../core/Entry";
import { ForegroundColor } from "../helpers/Theme"
import { StreakType } from "../core/Streak";
import { FetchUserContext, ProtectionType, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { ErrorPopupFromJson, FetchPendingSubmition, GetPostMessageContent, GetPostMessageType, JsonFromResp, PostAddStreak, PostCommit, PostMessageType, PostPendingSubmition, PostRemoveStreak } from "../helpers/Requests";
import { GetCalendarStatImageLinkFor } from "../helpers/Resources";
import { CalendarWithSelector, GetAnchorDate, MonthStats, StatEntryType } from "./Calendar";
import { ExtendedStreakModal } from "./ExtendedStreak";
import { Img } from "../core/Img";
import { ExtendedType, ParseExtendedType } from "../core/Extended";

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

export const EntryText: React.FC<{ text: string }> = ({text}) => (
	<Text weight="3" style={{marginLeft: '5px', textAlign: 'justify'}}>{text}</Text>
)	

const StreaksHeader: React.FC<{ icon: JSX.Element, text: string, onAction: () => void }> = ({ icon, text, onAction }) => {
	const ActionButton = (
		<Button
			size='s'
			mode='bezeled'
			onClick={onAction}
			style={{ marginLeft: 'auto', marginRight: '5px' }}
		>
			<div style={AlignCenterStyle}>
				{icon}
				<EntryText text={' ' + text}/>
			</div>
		</Button>
	)

	const Header = (
		<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
			<Text weight="2">{'Streaks'}</Text>
			{ActionButton }
		</div>
	)

	return Header;
}

const StreakEntryModal: React.FC<{ streak: StreakType }> = ({ streak }) => {
	let [anchor, setAnchor] = useState(GetAnchorDate())

	const stats: StatEntryType[] = [
		{
			Name: 'Commited',
			Value: streak.CountProtectionsInMonth(anchor, ProtectionType.Commit) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Commit)
		},
		{
			Name: 'Freezed',
			Value: streak.CountProtectionsInMonth(anchor, ProtectionType.Freeze) ?? 0,
			IconPath: GetCalendarStatImageLinkFor(ProtectionType.Freeze)
		}
	]
	


	return (
		<div style={{paddingBottom: '10%'}}>
			<div style={{ padding: '5%' }}>
				<div style={{display: 'flex', alignItems: 'center', justifyItems: 'space-between'}}>
					<Title weight="1">Streak '{streak.Description}'</Title>
					<Modal.Close>
						<IconButton size='s' mode='plain'><Icon28Close /></IconButton>
					</Modal.Close>
				</div>
				<br/>
				<Text weight="2">{streak.Count ? `Is ${streak.Count} days long` : 'Is inactive now, commit to activate it'}</Text>
				<br/>
			</div>
			<CalendarWithSelector
				today={anchor}
				onDateChanged={setAnchor}
				afterSelector={
					<MonthStats stats={stats} />
				}
				history={streak.History}
				start={streak.Start}
			/>
		</div>
	)
}

type OnChangeMode = () => void

const StreaksUsage: React.FC<{ onChangeMode: OnChangeMode }> = ({ onChangeMode }) => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const [fetched, setFetched] = useState(false)
	const [toCommit, setToCommit] = useState<number[]>([])
	const [extended, setExtended] = useState<ExtendedType>()

	if (!fetched) {
		FetchPendingSubmition()
			.then((pending) => setToCommit(pending.concat(toCommit)))
			.finally(() => setFetched(true))
	}

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnEdit = () => {
		onChangeMode()
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

		const EntryContent = (
			<Entry
				before={<div style={AlignCenterStyle}>{ Box }</div>}
				after={IsFreezed ? FreezeIcon :<IconButton style={{ visibility: 'hidden' }} size='s' mode='plain' disabled={true} ><Icon28Close /></IconButton>}
				style={{ paddingLeft: '10px' }}
			>
				<EntryText text={streak.Description}/>
			</Entry>
		)

		return (
			<Modal
				trigger={EntryContent}
				style={{background: ForegroundColor()} }
			>
				<StreakEntryModal streak={streak}/>
			</Modal>
		)
	}

	const ActiveStreakEntires = userContext?.Streaks.filter(s => s.IsRequired()).map(MakeStreakEntry) ?? []
	const UnactiveStreakEntires = userContext?.Streaks.filter(s => s.IsOptional()).map(MakeStreakEntry) ?? []

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

	const StreakEntriesStyle: CSSProperties = {
		paddingTop: '5px',
		paddingBottom: '5px',
	}

	const ActiveStreakSection = (
		<div>
			{ActiveStreakEntires.length ? <Text weight="3">Required</Text> : null}
			<Section style={StreakEntriesStyle}>
				{ActiveStreakEntires}
			</Section>
		</div>
	)
	const UnactiveStreakSection = (
		<div>
			{UnactiveStreakEntires.length ? <Text weight="3">Optional</Text> : null}
			<Section style={StreakEntriesStyle}>
				{UnactiveStreakEntires}
			</Section>
		</div>
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
			<StreaksHeader icon={<Icon28Edit />} text="Edit" onAction={OnEdit} />
			{ActiveStreakSection}
			{UnactiveStreakSection }
			{CommitButton }
		</div>
	)
}

const StreaksEdit: React.FC<{ onChangeMode: OnChangeMode, }> = ({ onChangeMode }) => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const [tempStreaks, setTempStreaks] = useState<string[]>([])
	const [removeStreaks, setRemoveStreaks] = useState<number[]>([])
	const [entry, setEntry] = useState("")

	const EntryStyle: CSSProperties = {
		paddingLeft: '10px'
	}

	const StreakEntries = userContext?.Streaks
		.filter(streak => removeStreaks.find(e => e === streak.Id) === undefined)
		.map((streak) =>
	{
		const canRemove = !streak.HasEverProtected() && !streak.IsChallenge();

		const OnRemove = () => {
			if (!canRemove)
				return

			setRemoveStreaks(
				removeStreaks.concat([streak.Id])
			)
			PostRemoveStreak([streak.Id]).then(JsonFromResp).then(ErrorPopupFromJson)
		}

		const buttonStyle: CSSProperties = {
			opacity: canRemove ? 1 : 0,
			cursor: canRemove ? undefined : 'default'
		}

		const RemoveButton = (
			<IconButton size='s' mode='plain' onClick={OnRemove} style={buttonStyle}>
				<Icon28Close/>
			</IconButton>
		)

		return (
			<Entry style={EntryStyle} after={RemoveButton}>
				<EntryText text={streak.Description} />
			</Entry>
		)
	})

	const TempStreakEntries = tempStreaks.map((description, index) => {
		const OnRemove = () => {
			setTempStreaks(
				tempStreaks.filter((_, i) => i !== index)
			)
		}

		const RemoveButton = (
			<IconButton size='s' mode='plain' onClick={OnRemove}>
				<Icon28Close />
			</IconButton>
		)

		return (
			<Entry style={EntryStyle} after={RemoveButton}>
				<EntryText text={description}/>
			</Entry>
		)
	})

	const OnSave = () => {
		onChangeMode()

		PostAddStreak(tempStreaks).then(JsonFromResp).then(ErrorPopupFromJson).then(Refresh)
	}

	const IsNotMakredRemoved = (streak: StreakType)=>{
		return !removeStreaks.includes(streak.Id)
	}
	const TakenStreakNames = userContext?.Streaks.filter(IsNotMakredRemoved).map(s => s.Description).concat(tempStreaks)

	const CanAddEntry = !TakenStreakNames?.includes(entry);

	const OnAdd = () => {
		if (entry.length === 0 || !CanAddEntry)
			return

		setTempStreaks(tempStreaks.concat([entry]))
		setEntry("")
	}
	
	const AddCurrent = (
		<IconButton
			size='s'
			mode='plain'
			onClick={OnAdd}
			style={{ marginLeft: 'auto', marginRight: '0px' }}
		>
			<Icon28AddCircle />
		</IconButton>
	)

	const EditCurrent = (
		<Entry
			after={AddCurrent}
			style={{padding: '5px'}}
		>
			<Input
				placeholder="Clean your house!"
				value={entry}
				status={ !CanAddEntry ? "error" : "default" }
				header={ !CanAddEntry ? `Streak '${entry}' is already added` : null }
				onChange={e => setEntry(e.target.value)}
				style={{marginLeft: '0px', marginRight: '0px'}}
			/>
		</Entry>
	)


	return (
		<div>
			<StreaksHeader icon={<Icon28Archive />} text="Save" onAction={OnSave} />
			<div style={{ paddingTop: '5px'}}>
				<Section>
					{StreakEntries}
					{TempStreakEntries}
					{EditCurrent }
				</Section>
			</div>
		</div>

	)
}

const Streaks = () => {
	const [edit, setEdit] = useState<boolean>(false)

	const OnStartEdit = () => {
		setEdit(true)
	}

	const OnFinishEdit = () => {
		setEdit(false)
	}

	return edit ? <StreaksEdit onChangeMode={OnFinishEdit} /> : <StreaksUsage onChangeMode={OnStartEdit}/>
}

export const CommitSection = () => {
	return (
		<div>
			<Streaks/>
		</div>
	)
};
