import { Button, List, Text } from "@xelene/tgui";
import { CSSProperties } from "react";
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostAddFreeze } from "../helpers/Requests";
import { Freeze } from "./Freeze";




export const FreezeSection = () => {
	const buttonStyle: CSSProperties = {
		margin: '10px',
		display: 'inline-flex',
	}

	const setUserContext = useSetUserContext()
	const userContext = useGetUserContext()

	const ReachedMaxFreezes = !userContext?.CanAddFreeze() ?? false

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnAddFreeze = () => {
		PostAddFreeze().then(JsonFromResp).then(PopupFromJson).then(Refresh);
	}

	const AddFreezeButton = (
		<Button
			size="s"
			disabled={ReachedMaxFreezes}
			style={buttonStyle}
			mode="bezeled"
			onClick={OnAddFreeze}
		>
			Add
		</Button>
	)

	const FreezesList = (
		<List>
			{userContext?.AvailableFreezes.map((freeze) =>
				<Freeze freeze={userContext?.Freezes[freeze]} id={freeze} />)
			}
		</List>
	)

	return (
		<List>
			<div style={{margin: '10px'}}>
				<Text weight="2">Freezes</Text>
				<br/>
				<Text weight="3" style={{margin: '0px 10px'} }>Equipped { userContext?.AvailableFreezes.length ?? 0 }/{ userContext?.MaxFreezes ?? 0}</Text>
				{AddFreezeButton}
			</div>
			<br />
			{FreezesList}
		</List>
	)
}