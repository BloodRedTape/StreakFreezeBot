import { Button, Checkbox, IconButton, Text } from "@xelene/tgui";
import { Icon28Archive } from "@xelene/tgui/dist/icons/28/archive";
import { Icon28Close } from "@xelene/tgui/dist/icons/28/close";
import { Icon28Edit } from "@xelene/tgui/dist/icons/28/edit";
import { CSSProperties, useState } from "react";
import { Entry } from "../core/Entry";
import { StreakType } from "../core/Streak";
import { FetchUserContext, ProtectionType, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostCommit } from "../helpers/Requests";

const AlignCenterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center'
}

const EntryText: React.FC<{ text: string }> = ({text}) => (
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

type OnChangeMode = () => void

const StreaksUsage: React.FC<{ onChangeMode: OnChangeMode }> = ({ onChangeMode }) => {
	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const [toCommit, setToCommit] = useState<number[]>([])

	const OnEdit = () => {
		onChangeMode()
	}

	const MakeStreakEntry = (streak: StreakType) => {
		if (!userContext)
			return (<div></div>)

		let CanCommit = !streak.IsProtectedAt(userContext.Today) //XXX
		
		const IsCommited = () => {
			return streak.ProtectionAt(userContext.Today) == ProtectionType.Commit
		}

		const SetCheck = (check: boolean) => {
			if (check)
				setToCommit(toCommit.concat([streak.Id]))
			else
				setToCommit(toCommit.filter(e => e !== streak.Id))
		}

		const Box = IsCommited()
			? (<Checkbox checked disabled={!CanCommit} onChange={e => SetCheck(e.target.checked)} />)
			: (<Checkbox disabled={!CanCommit} onChange={e => SetCheck(e.target.checked)} />)
		
		return (
			<Entry
				before={<div style={AlignCenterStyle}>{ Box }</div>}
				after={<IconButton style={{ opacity: '-1' }} size='s' mode='plain' disabled={true} ><Icon28Close /></IconButton>}
				style={{ padding: '4px' }}
			>
				<EntryText text={streak.Description} />
			</Entry>
		)
	}

	const ActiveStreakEntires = userContext?.Streaks.filter(s => s.Active()).map(MakeStreakEntry) ?? []
	const UnactiveStreakEntires = userContext?.Streaks.filter(s => s.Unactive()).map(MakeStreakEntry) ?? []

	const OnCommit = () => {
		if (!toCommit.length)
			return

		PostCommit(toCommit).then(JsonFromResp).then(PopupFromJson).then(Refresh);
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

	const ActiveStreakSection = (
		<div>
			{ActiveStreakEntires.length ? <Text weight="3">Active</Text> : null}
			{ActiveStreakEntires}
		</div>
	)
	const UnactiveStreakSection = (
		<div>
			{UnactiveStreakEntires.length ? <Text weight="3">Unactive</Text> : null}
			{UnactiveStreakEntires}
		</div>
	)

	return (
		<div>
			<StreaksHeader icon={<Icon28Edit />} text="Edit" onAction={OnEdit} />	
			{ActiveStreakSection}
			{UnactiveStreakSection }
			{CommitButton }
		</div>
	)
}

const StreaksEdit: React.FC<{ onChangeMode: OnChangeMode }> = ({onChangeMode}) => {
	const OnSave = () => {
		onChangeMode()
	}

	return (
		<StreaksHeader icon={<Icon28Archive/>} text="Save" onAction={ OnSave }/>	
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
