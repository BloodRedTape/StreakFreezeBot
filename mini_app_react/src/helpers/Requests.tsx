import { PopupParams, postEvent, retrieveLaunchParams } from "@telegram-apps/sdk-react";

export const GatherCurrentUserId = (): number => {
	const debugId = 399828804
	try {
		const launchParams = retrieveLaunchParams();
		return launchParams.initData?.user?.id ?? debugId;
	} catch (e) {
		return debugId;
	}
}

export const GatherUserCompleteName = (): string => {
	const launchParams = retrieveLaunchParams();

	const user = launchParams.initData?.user

	return user?.firstName ?? 'Unknown User' + user?.lastName ?? ' ';
}

const GatherServerUrl = () => {
	return window.location.origin
}

const MakeUserRequestLocation = () => {
    return GatherServerUrl() + '/user/' + GatherCurrentUserId()
}

export const GetFullUser = () => {
	return fetch(MakeUserRequestLocation() + '/full')
}

export const GetAvailableFreezes = () => {
	return fetch(MakeUserRequestLocation() + '/available_freezes')
}

export const PostCommit = () => {
	return fetch(MakeUserRequestLocation() + '/commit', {method: 'POST'})
}

export const PostAddFreeze = (expire: number, reason: string) => {
	const body = JSON.stringify({ expire: expire, reason: reason });
	return fetch(MakeUserRequestLocation() + '/add_freeze',
		{
			method: 'POST',
			body: body,
			headers: {
				'Content-Type': 'application/json'
			},
		}
	)
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

export const SimplePopup = (title: string, message: string) => {
	const params: PopupParams = {
		title: title,
		message: message,
		buttons: [
			{id: "none", type: 'ok'}
		]
	};
	postEvent('web_app_open_popup', params)
}


export const GetQuote = () => {
	return fetch(GatherServerUrl() + '/quote')
		.then(JsonFromResp)
		.then((body) => body.quote ?? 'There is nothing better that extending your streak!')
}

export const PostAcceptInvite = (from: number) => {
	return fetch(MakeUserRequestLocation() + '/friends/accept/' + from, {method: 'POST'})
}
export const PostRemoveFriend = (friend: number) => {
	return fetch(MakeUserRequestLocation() + '/friends/remove/' + friend, {method: 'POST'})
}

export const GetFriends = () => {
	return fetch(MakeUserRequestLocation() + '/friends')
}

export const GetTgFullUser = () => {
	return fetch(GatherServerUrl() + '/tg/user/' + GatherCurrentUserId() + '/full')
}

export const ProfilePhotoUrlFor = (id: number) => {
	return GatherServerUrl() + '/tg/user/' + id + '/photo'
}

export const ProfilePhotoUrl = () => {
	return ProfilePhotoUrlFor(GatherCurrentUserId())
}
