import { PopupParams, postEvent, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { ToDoCompletion, ToDoDescription } from "../core/ToDo";

export const GatherCurrentUserId = (): number => {
	const debugId = 399828804
	try {
		const launchParams = retrieveLaunchParams();
		return launchParams.initData?.user?.id ?? debugId;
	} catch (e) {
		return debugId;
	}
}

export const MakeTelegramAuthHeaders = (): [string, string][] =>{
	const launchParams = retrieveLaunchParams();
	return [
		['DataCheckString', launchParams.initDataRaw ?? 'None'],
		['Hash', launchParams.initData?.hash ?? 'None']
	]
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
	return fetch(MakeUserRequestLocation() + '/full', { headers: MakeTelegramAuthHeaders()})
}

export const GetAvailableFreezes = () => {
	return fetch(MakeUserRequestLocation() + '/available_freezes', { headers: MakeTelegramAuthHeaders()})
}

export const PostCommit = () => {
	return fetch(MakeUserRequestLocation() + '/commit', {method: 'POST', headers: MakeTelegramAuthHeaders()})
}

export const PostAddFreeze = (expire: number, reason: string) => {
	const body = JSON.stringify({ expire: expire, reason: reason });
	const headers = MakeTelegramAuthHeaders().concat([ 
		['Content-Type', 'application/json'],
	])

	return fetch(MakeUserRequestLocation() + '/add_freeze',
		{
			method: 'POST',
			body: body,
			headers: headers
		}
	)
}

export const PostUseFreeze = (id: number) => {
	const body = JSON.stringify({ freeze_id: id });
	const headers = MakeTelegramAuthHeaders().concat([ 
		['Content-Type', 'application/json'],
	])

	return fetch(MakeUserRequestLocation() + '/use_freeze',
		{
			method: 'POST',
			body: body,
			headers: headers
		}
	)
}

export const PostRemoveFreeze = (id: number) => {
	const body = JSON.stringify({ freeze_id: id });
	const headers = MakeTelegramAuthHeaders().concat([ 
		['Content-Type', 'application/json'],
	])

	return fetch(MakeUserRequestLocation() + '/remove_freeze',
		{
			method: 'POST',
			body: body,
			headers: headers
		}
	)
}


export const PostResetStreak = () => {
	return fetch(MakeUserRequestLocation() + '/reset_streak', {method: 'POST', headers: MakeTelegramAuthHeaders()})
}

const Fail = 'Failure'

export const GetResultMessageType = (json: any) => {
	if ('Ok' in json) {
		return 'Success'
	}
	if ('Fail' in json) {
		return Fail
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

export const ErrorPopupFromJson = (json: any) => {
	if (GetResultMessageType(json) !== Fail)
		return

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
	return fetch(MakeUserRequestLocation() + '/friends/accept/' + from, {method: 'POST', headers: MakeTelegramAuthHeaders()})
}
export const PostRemoveFriend = (friend: number) => {
	return fetch(MakeUserRequestLocation() + '/friends/remove/' + friend, {method: 'POST', headers: MakeTelegramAuthHeaders()})
}

export const GetFriends = () => {
	return fetch(MakeUserRequestLocation() + '/friends', { headers: MakeTelegramAuthHeaders() })
}

export const GetTgFullUserById = (id: number) => {
	return fetch(GatherServerUrl() + '/tg/user/' + id + '/full', { headers: MakeTelegramAuthHeaders() })
}

export const GetTgFullUser = () => {
	return GetTgFullUserById(GatherCurrentUserId())
}

export const ProfilePhotoUrlFor = (id: number) => {
	return GatherServerUrl() + '/tg/user/' + id + '/photo'
}

export const ProfilePhotoUrl = () => {
	return ProfilePhotoUrlFor(GatherCurrentUserId())
}

export const GetPersistentTodo = () => {
	return fetch(MakeUserRequestLocation() + '/todo/persistent', { headers: MakeTelegramAuthHeaders() })
}

export const PostPersistentTodo = (todo: ToDoDescription) => {
	return fetch(MakeUserRequestLocation() + '/todo/persistent', {method: 'POST', body: JSON.stringify(todo), headers: MakeTelegramAuthHeaders()})
}

export const GetPersistentCompletion = () => {
	return fetch(MakeUserRequestLocation() + '/todo/persistent/completion', {headers: MakeTelegramAuthHeaders()})
}

export const PostPersistentCompletion = (todo: ToDoCompletion) => {
	return fetch(MakeUserRequestLocation() + '/todo/persistent/completion', {method: 'POST', body: JSON.stringify(todo), headers: MakeTelegramAuthHeaders()})
}

export const PostNudge = (friend: number, text: string) => {
	return fetch(MakeUserRequestLocation() + '/nudge/' + friend, {method: 'POST', body: text, headers: MakeTelegramAuthHeaders()})
}
