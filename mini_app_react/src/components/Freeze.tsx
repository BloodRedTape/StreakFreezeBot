import { Banner, Button, Image, List } from "@xelene/tgui";
import React from "react";
import { FetchUserContext, StreakFreezeType, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostRemoveFreeze, PostUseFreeze } from "../helpers/Requests";



export const Freeze: React.FC<{ freeze: StreakFreezeType, id: number }> = ({ freeze, id }) => {

	const userContext = useGetUserContext()
	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnUse = () => {
		PostUseFreeze(id)
			.then(JsonFromResp)
			.then(PopupFromJson)
			.then(Refresh)
	}

	const CanFreeze = !userContext?.IsProtected() && userContext?.Streak !== 0 || false;

	const UseButton = (<Button size="s" onClick={OnUse} disabled={!CanFreeze}>Use</Button>)

	const OnRemove = () => {
		PostRemoveFreeze(id)
			.then(Refresh)
	}

	const RemoveButton = (<Button mode="plain" size="s" onClick={ OnRemove }>Remove</Button>)

	const ActionPanel = (
		<React.Fragment key=".0">
			{UseButton}
			{RemoveButton}
        </React.Fragment>
	)

	return (
		<Banner
			header={'Freeze ' + id + ' | ' + freeze.Reason}
			subheader={'Due to ' + freeze.ExpireAt.toDateString()}
			before={<Image size={40} src="https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png" />}
		>
			<List>
				{ ActionPanel }
			</List>
		</Banner>
	)
}