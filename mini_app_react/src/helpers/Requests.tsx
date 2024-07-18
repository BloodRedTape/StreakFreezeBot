import { PopupParams, postEvent, retrieveLaunchParams } from "@telegram-apps/sdk-react";

const GatherCurrentUserId = (): number => {
	const debugId = 399828804
	try {
		const launchParams = retrieveLaunchParams();
		return launchParams.initData?.user?.id ?? debugId;
	} catch (e) {
		return debugId;
	}
}

export const MakeUserRequestLocation = () => {
    return window.location.origin + '/user/' + GatherCurrentUserId()
}

export const MakeFullUserRequestLocation = () => {
    return MakeUserRequestLocation() + '/full' 
}

export const GetAvailableFreezes = () => {
	return fetch(MakeUserRequestLocation() + '/available_freezes')
}

export const PostCommit = () => {
	return fetch(MakeUserRequestLocation() + '/commit', {method: 'POST'})
}

export const PostAddFreeze = () => {
	return fetch(MakeUserRequestLocation() + '/add_freeze', {method: 'POST'})
}

export const PostUseFreeze = (id: number) => {
	const body = JSON.stringify({ freeze_id: id });
	return fetch(MakeUserRequestLocation() + '/use_freeze',
		{
			method: 'POST',
			body: body,
			headers: {
				'Content-Type': 'application/json'
			},
		}
	)
}

export const PostRemoveFreeze = (id: number) => {
	const body = JSON.stringify({ freeze_id: id });
	return fetch(MakeUserRequestLocation() + '/remove_freeze',
		{
			method: 'POST',
			body: body,
			headers: {
				'Content-Type': 'application/json'
			},
		}
	)
}


export const PostResetStreak = () => {
	return fetch(MakeUserRequestLocation() + '/reset_streak', {method: 'POST'})
}

export const GetResultMessageType = (json: any) => {
	if ('Ok' in json) {
		return 'Success'
	}
	if ('Fail' in json) {
		return 'Failure'
	}

	return 'Program Error'
}

export const GetResultMessage = (json: any)=>{
	return json.Ok || json.Fail || 'Internal Error'
}

export const JsonFromResp = (response: Response) => {
	return response.json()
}

export const PopupFromJson = (json: any) => {
	const params: PopupParams = {
		title: GetResultMessageType(json),
		message: GetResultMessage(json),
		buttons: [
			{id: "none", type: 'ok'}
		]
	};
	postEvent('web_app_open_popup', params)
}
