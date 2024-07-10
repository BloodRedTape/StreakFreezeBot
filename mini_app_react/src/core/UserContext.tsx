import React, { Dispatch, SetStateAction, useContext } from "react"
import { DebugLog } from '../helpers/Debug'

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

	public get Days() {
        return this.History.length;
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
	} catch (e: any) {
		DebugLog(e);
	}

	DebugLog(UserContextTypeToString(context))
    return context;
}



type UserContextPairType = [UserContextType, Dispatch<SetStateAction<UserContextType>>]

export const UserContext = React.createContext<UserContextPairType | undefined>(undefined)

export const useUserContext = () => {
	const ctx = useContext(UserContext)

	if (ctx === undefined)
		throw "very sad"

	return ctx
}
