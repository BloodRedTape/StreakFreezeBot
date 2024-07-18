import { Banner, Button, Image } from "@xelene/tgui";
import React from "react";
import { FetchUserContext, StreakFreezeType, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostRemoveFreeze, PostUseFreeze } from "../helpers/Requests";



export const Freeze: React.FC<{ freeze: StreakFreezeType, id: number }> = ({ freeze, id }) => {

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

	const UseButton = (<Button size="s" onClick={ OnUse }>Use</Button>)

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
			header={'Freeze ' + id}
			subheader={'Due to ' + freeze.ExpireAt.toDateString()}
			before={<Image size={40} src="https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png" />}
		>
			{ ActionPanel }
		</Banner>
	)
}