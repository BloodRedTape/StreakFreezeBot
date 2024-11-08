import { PopupParams, postEvent, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { ChallengeParticipantType, ChallengeRulesType, ChallengeWithPayloadType, ParseChallengeParticipantType, ParseChallengeWithPayloadType } from "../core/Challenge";
import { ToDoCompletion, ToDoDescription } from "../core/ToDo";
import { ToApiDate } from "../core/UserContextSerialization";

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

export const PostCommit = (streaks: number[]) => {
	return fetch(MakeUserRequestLocation() + '/commit', {method: 'POST', headers: MakeTelegramAuthHeaders(), body: JSON.stringify(streaks)})
}

export const PostAddStreak = (streaks: string[]) => {
	if (!streaks.length)
		return Promise.resolve(undefined)

	return fetch(MakeUserRequestLocation() + '/add_streak', {method: 'POST', headers: MakeTelegramAuthHeaders(), body: JSON.stringify(streaks)})
}

export const PostRemoveStreak = (streaks: number[]) => {
	if (!streaks.length)
		return Promise.resolve(undefined)

	return fetch(MakeUserRequestLocation() + '/remove_streak', {method: 'POST', headers: MakeTelegramAuthHeaders(), body: JSON.stringify(streaks)})
}

export const PostPendingSubmition = (streaks: number[]) => {
	return fetch(MakeUserRequestLocation() + '/pending_submition', {method: 'POST', headers: MakeTelegramAuthHeaders(), body: JSON.stringify(streaks)})
}

export const GetPendingSubmition = () => {
	return fetch(MakeUserRequestLocation() + '/pending_submition', {method: 'GET', headers: MakeTelegramAuthHeaders()})
}

export const FetchPendingSubmition = async (): Promise<number[]> => {
	const resp = await GetPendingSubmition()

	if (!resp.ok)
		return []

	const json = await resp.json()

	const ToNumber = (e: any): number => { return e }

	return json.map(ToNumber) || []
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

export enum PostMessageType {
	Unknown,
	Ok,
	Fail,
	Data
}

export const GetPostMessageType = (json: any) => {
	if (json === undefined)
		return PostMessageType.Unknown

	if ('Ok' in json) 
		return PostMessageType.Ok

	if ('Fail' in json)
		return PostMessageType.Fail

	if ('Data' in json)
		return PostMessageType.Data

	return PostMessageType.Unknown
}

export const GetPostMessageTypeString = (type: PostMessageType) => {
	return PostMessageType[type]
}

export const GetPostMessageContent = (json: any) => {
	const type = GetPostMessageType(json)

	return json[PostMessageType[type]]
}

export const GetPostMessageContentString = (json: any) => {
	return GetPostMessageContent(json) ?? 'Internal error'
}


export const JsonFromResp = (response: Response | undefined) => {
	return response?.json()
}

export const PopupFromJson = (json: any) => {
	if (json === undefined)
		return

	const params: PopupParams = {
		title: GetPostMessageTypeString(json),
		message: GetPostMessageContent(json),
		buttons: [
			{id: "none", type: 'ok'}
		]
	};
	postEvent('web_app_open_popup', params)
}

export const ErrorPopupFromJson = (json: any): boolean => {
	if (GetPostMessageType(json) !== PostMessageType.Fail)
		return false

	const params: PopupParams = {
		title: GetPostMessageTypeString(json),
		message: GetPostMessageContent(json),
		buttons: [
			{id: "none", type: 'ok'}
		]
	};
	postEvent('web_app_open_popup', params)
	return true
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

export const PostNewChallenge = (name: string, start: Date, duration: number, todo: string[]) => {
	let challenge: any = {}
	challenge.Name = name
	challenge.Start = ToApiDate(start)
	challenge.Duration = duration
	challenge.ToDo = todo 
	challenge.Type = ChallengeRulesType.Duration

	return fetch(MakeUserRequestLocation() + '/challenges/new', {
		method: 'POST',
		headers: MakeTelegramAuthHeaders(),
		body: JSON.stringify(challenge)
	})
}

export const PostJoinChallenge = (challenge: number) => {
	return fetch(MakeUserRequestLocation() + '/challenges/join/' + challenge, {
		method: 'POST',
		headers: MakeTelegramAuthHeaders()
	})
}

export const GetChallengeParticipants = (challenge: number) => {
	return fetch(MakeUserRequestLocation() + '/challenges/participants/' + challenge, { headers: MakeTelegramAuthHeaders() })
}

export const FetchChallengeParticipants = (challenge: number): Promise<ChallengeParticipantType[]> => {
	return GetChallengeParticipants(challenge).then(JsonFromResp).then(e => (e || []).map(ParseChallengeParticipantType))
}

export const GetChallengeInvitePreview = (challenge: number) => {
	return fetch(MakeUserRequestLocation() + '/challenges/invite_preview/' + challenge, { headers: MakeTelegramAuthHeaders() })
}

export const FetchChallengeInvitePreview = (challenge: number): Promise<ChallengeWithPayloadType> => {
	return GetChallengeInvitePreview(challenge).then(JsonFromResp).then(ParseChallengeWithPayloadType)
}

export const GetChallengeInviteParticipantsPreview = (challenge: number) => {
	return fetch(MakeUserRequestLocation() + '/challenges/invite_participants_preview/' + challenge, { headers: MakeTelegramAuthHeaders() })
}

export const FetchChallengeInviteParticipantsPreview = (challenge: number): Promise<ChallengeParticipantType[]> => {
	return GetChallengeInviteParticipantsPreview(challenge).then(JsonFromResp).then(e => (e || []).map(ParseChallengeParticipantType))
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

export const PlaceholderUrlFor = (text: string): string => {
    const urlSafeString = text.replace(/[^a-zA-Z0-9-_\.]/g, '');

    return GatherServerUrl() + '/placeholder/' + urlSafeString;
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
