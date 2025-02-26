import { addDays, differenceInDays, getDaysInMonth } from "date-fns"
import React, { Dispatch, SetStateAction, useContext } from "react"
import { GetFullUser } from "../helpers/Requests"
import { ChallengeWithPayloadType } from "./Challenge"
import { StreakType } from "./Streak"
import { ParseUserContextType } from "./UserContextSerialization"

export class StreakFreezeType {
	public EarnedAt: Date = new Date(0, 0, 0)
	public ExpireAt: Date = new Date(0, 0, 0)
	public UsedAt?: Date = undefined
	public Reason: string = ""
}

export enum ProtectionType {
	None,
	Commit,
	Freeze,
	NothingToProtect
}

export const ProtectionAt = (date: Date, history: ProtectionType[], start: Date): ProtectionType => {
	const index = differenceInDays(date, start)

	return history[index] ?? ProtectionType.None
}

export class UserContextType{
	public Freezes: Array<StreakFreezeType> = []
	public MaxFreezes: number = 0
	public Friends : Array<number> = []

	public History: Array<ProtectionType> = []
	public Today: Date = new Date(0, 0, 0)
	public Streak: number = 0
	public StreakStart: Date = new Date(0, 0, 0)
	public Streaks: Array<StreakType> = []
	public Challenges: Array<ChallengeWithPayloadType> = []

	public AvailableFreezes: Array<number> = []

	public ProtectionAt(date: Date): ProtectionType{
		return ProtectionAt(date, this.History, this.StreakStart)
	}

	public IsProtectedAt(date: Date): boolean {
		return this.ProtectionAt(date) !== ProtectionType.None
	}

	public IsProtected() {
		return this.IsProtectedAt(this.Today)
	}

	public HasStreak(): boolean {
		return this.StreakSize() != 0;
	}

	public HasStreakNamed(name: string): boolean {
		return this.Streaks.find(s => s.Description === name) !== undefined
	}

	public StreakSize(): number {
		return this.Streak;
	}

	public Yesterday(): Date {
		return addDays(this.Today, -1)
	}

	public AreActiveProtected(): boolean {
		let isProtected = true
		this.Streaks.forEach((streak) => {
			if (streak.IsRequired() && !streak.IsProtectedAt(this.Today))
				isProtected = false
		})

		return isProtected;
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

	public IsAFriend(id: number): boolean {
		return this.Friends.find(e => e === id) !== undefined
	}

	public GetRunningChallenges(): Array<ChallengeWithPayloadType> {
		return this.Challenges.filter(c => c.IsRunning() && !c.HasLost)
	}

	public GetChallenge(id: number): ChallengeWithPayloadType | undefined {
		return this.Challenges.find(c => c.Id === id)
	}

	public CanFreeze(): boolean {
		for(const streak of this.Streaks) {
			if (streak.Required && streak.Freezable && !streak.IsProtectedAt(this.Today))
				return true	
		}

		return false
	}
}

type UserContextPairType = [UserContextType | undefined, Dispatch<SetStateAction<UserContextType | undefined>>]

export const UserContext = React.createContext<UserContextPairType | undefined>(undefined)

export const useUserContext = () => {
	const ctx = useContext(UserContext)

	if (ctx === undefined)
		throw new Error("provide UserContext via UserContext.Provider")

	return ctx
}

export const useSetUserContext = () => {
	return useUserContext()[1]
}

export const useGetUserContext = () => {
	return useUserContext()[0]
}

export const FetchUserContext = async () => {
	const full_resp = await GetFullUser()

	let user: UserContextType = ParseUserContextType(await full_resp.json())

	return user;
}

export const RefreshUserContext = (action: React.Dispatch<UserContextType | undefined>) => {
	FetchUserContext().then(action)	
}