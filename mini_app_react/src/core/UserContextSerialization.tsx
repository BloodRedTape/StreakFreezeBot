import { DebugLog } from "../helpers/Debug";
import { ParseChallengeWithPayloadType } from "./Challenge";
import { ParseStreakType } from "./Streak";
import { ProtectionType, StreakFreezeType, UserContextType } from "./UserContext";

export const FromApiDate = (data: any) => {
	if (Array.isArray(data) && data.length >= 3) {
	    return new Date(data[2], data[1] - 1, data[0]);
    } else {
        return new Date(0, 0, 0);
    }
}

export const ToApiDate = (date: Date) => {
	return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
}

export const FromApiDateNullable = (data: any): Date | null => {
	if (Array.isArray(data) && data.length >= 3) {
	    return new Date(data[2], data[1] - 1, data[0]);
	} else {
		return null;
    }
}

const ParseStreakFreezeType = (data: any): StreakFreezeType =>{
    const freeze = new StreakFreezeType();
    freeze.EarnedAt = FromApiDate(data.EarnedAt);
    freeze.ExpireAt = FromApiDate(data.ExpireAt);
    if (data.UsedAt) {
        freeze.UsedAt = FromApiDate(data.UsedAt);
	}
	freeze.Reason = data.Reason ?? ""

    return freeze;
}

export const ParseProtectionType = (data: any): ProtectionType => {
	if (data == 0)
		return ProtectionType.None
	if (data == 1)
		return ProtectionType.Commit
	if (data == 2)
		return ProtectionType.Freeze
	if (data == 3)
		return ProtectionType.NothingToProtect
	return ProtectionType.None
}

export const UserContextTypeToString = (context: UserContextType): string => {
	// Helper function to convert a StreakFreezeType instance to a plain object
	const streakFreezeToObject = (freeze: StreakFreezeType) => {
		return {
			EarnedAt: freeze.EarnedAt.toISOString(),
			ExpireAt: freeze.ExpireAt.toISOString(),
			UsedAt: freeze.UsedAt ? freeze.UsedAt.toISOString() : null,
			Reason: freeze.Reason
		};
	};

	// Convert the UserContextType instance to a plain object
	const contextObject = {
		Freezes: context.Freezes.map(streakFreezeToObject),
		StreakStart: context.StreakStart.toISOString(),
		History: context.History,
		MaxFreezes: context.MaxFreezes,
		Today: context.Today,
		Streak: context.Streak,
		Friends: context.Friends
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
		context.Today = FromApiDate(data.Today)
		context.Streak = data.Streak || 0
		context.Friends = (data.Friends || []).map((friend: any): number => friend)
		context.Streaks = (data.Streaks || []).map((streak: any) => ParseStreakType(streak))
		context.Challenges = (data.Challenges || []).map((challenge: any) => ParseChallengeWithPayloadType(challenge))
		context.AvailableFreezes = 	(data.AvailableFreezes || []).map((freeze: number) => freeze)
	} catch (e: any) {
		DebugLog(e);
	}

    return context;
}
