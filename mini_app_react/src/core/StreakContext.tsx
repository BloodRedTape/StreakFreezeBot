import React, { Dispatch, SetStateAction, useContext } from "react"

export type StreakContextType = {
	Days: number
}

type StreakContextPairType = [StreakContextType, Dispatch<SetStateAction<StreakContextType>>]

export const StreakContext = React.createContext<StreakContextPairType | undefined>(undefined)

export const useStreakContext = () => {
	const ctx = useContext(StreakContext)

	if (ctx === undefined)
		throw "very sad"

	return ctx
}
