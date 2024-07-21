import { differenceInDays, getDaysInMonth } from "date-fns"
import React, { Dispatch, SetStateAction, useContext } from "react"
import { GetAvailableFreezes, GetFullUser } from "../helpers/Requests"
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
	Freeze
}

export class UserContextType{
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

		return this.History[index] ?? ProtectionType.None
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
	const full_resp = await GetFullUser()
	let freezes_resp = await GetAvailableFreezes()

	let user: UserContextType = ParseUserContextType(await full_resp.json())

	user.AvailableFreezes = (await freezes_resp.json() || []).map((freeze: number) => freeze)

	return user;
}

export const RefreshUserContext = (action: React.Dispatch<UserContextType | undefined>) => {
	FetchUserContext().then(action)	
}