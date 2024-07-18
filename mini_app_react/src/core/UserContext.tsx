import { differenceInDays, getDaysInMonth } from "date-fns"
import React, { Dispatch, SetStateAction, useContext } from "react"
import { DebugLog } from '../helpers/Debug'
import { GetAvailableFreezes, MakeFullUserRequestLocation } from "../helpers/Requests"

export class StreakFreezeType {
	public EarnedAt: Date = new Date(0, 0, 0)
	public ExpireAt: Date = new Date(0, 0, 0)
	public UsedAt?: Date = undefined
}

export enum ProtectionType {
	None,
	Commit,
	Freeze
}

export class UserContextType {
	public Freezes: Array<StreakFreezeType> = []
	public StreakStart: Date = new Date(0, 0, 0)
	public History: Array<ProtectionType> = []
	public AvailableFreezes: Array<number> = []
	public MaxFreezes: number = 0

	public get Days() {
        return this.History.length;
	}

	public ProtectionAt(date: Date): ProtectionType{
		const index = differenceInDays(date, this.StreakStart)

		return this.History[index]
	}

	public CountProtectionsInMonth(anchor: Date, protection: ProtectionType): number{
		let count = 0;

		for (let i = 0; i < getDaysInMonth(anchor); i++) {
			const date = new Date(anchor.getFullYear(), anchor.getMonth(), i + 1);

			count += this.ProtectionAt(date) == protection ? 1 : 0;
		}

		return count;
	}

	public CanAddFreeze(): boolean {
		return this.AvailableFreezes.length < this.MaxFreezes
	}
}

const FromApiDate = (data: any) => {
	if (Array.isArray(data) && data.length >= 3) {
	    return new Date(data[2], data[1] - 1, data[0]);
    } else {
        return new Date(0, 0, 0);
    }
}

const ParseStreakFreezeType = (data: any): StreakFreezeType =>{
    const freeze = new StreakFreezeType();
    freeze.EarnedAt = FromApiDate(data.EarnedAt);
    freeze.ExpireAt = FromApiDate(data.ExpireAt);
    if (data.UsedAt) {
        freeze.UsedAt = FromApiDate(data.UsedAt);
    }
    return freeze;
}

const ParseProtectionType = (data: any): ProtectionType => {
	if (data == 0)
		return ProtectionType.None
	if (data == 1)
		return ProtectionType.Commit
	if (data == 2)
		return ProtectionType.Freeze
	return ProtectionType.None
}

export const UserContextTypeToString = (context: UserContextType): string => {
	// Helper function to convert a StreakFreezeType instance to a plain object
	const streakFreezeToObject = (freeze: StreakFreezeType) => {
		return {
			EarnedAt: freeze.EarnedAt.toISOString(),
			ExpireAt: freeze.ExpireAt.toISOString(),
			UsedAt: freeze.UsedAt ? freeze.UsedAt.toISOString() : null
		};
	};

	// Convert the UserContextType instance to a plain object
	const contextObject = {
		Freezes: context.Freezes.map(streakFreezeToObject),
		StreakStart: context.StreakStart.toISOString(),
		History: context.History
	};

	// Convert the plain object to a JSON string
	return JSON.stringify(contextObject, null, 4); // The second argument is for a pretty-printed string
};

export const ParseUserContextType = (data: any): UserContextType => {
	const context = new UserContextType();
	try {
		context.Freezes = (data.Freezes || []).map((freeze: any) => ParseStreakFreezeType(freeze));
		context.StreakStart = FromApiDate(data.StreakStart);
		context.History = (data.History || []).map((protection: any) => ParseProtectionType(protection));
		context.MaxFreezes = data.MaxFreezes || 0
	} catch (e: any) {
		DebugLog(e);
	}

	DebugLog(UserContextTypeToString(context))
    return context;
}



type UserContextPairType = [UserContextType | undefined, Dispatch<SetStateAction<UserContextType | undefined>>]

export const UserContext = React.createContext<UserContextPairType | undefined>(undefined)

export const useUserContext = () => {
	const ctx = useContext(UserContext)

	if (ctx === undefined)
		throw "very sad"

	return ctx
}

export const useSetUserContext = () => {
	return useUserContext()[1]
}

export const useGetUserContext = () => {
	return useUserContext()[0]
}

export const FetchUserContext = async () => {
	const full_resp = await fetch(MakeFullUserRequestLocation())
	let freezes_resp = await GetAvailableFreezes()

	let user: UserContextType = ParseUserContextType(await full_resp.json())

	user.AvailableFreezes = (await freezes_resp.json() || []).map((freeze: number) => freeze)

	return user;
}

export const RefreshUserContext = (action: React.Dispatch<UserContextType | undefined>) => {
	FetchUserContext().then(action)	
}