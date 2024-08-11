import { ProtectionType } from "./UserContext"
import { FromApiDate, ParseProtectionType } from "./UserContextSerialization"


export class StreakType{
	public Description: string = ""
	public History: Array<ProtectionType> = []
	public Start: Date = new Date(0, 0, 0)
	public Count: number = 0
};


export const ParseStreakType = (data: any): StreakType => {
	const streak = new StreakType();

	streak.Description = data.Description ?? ""
	streak.History = (data.History || []).map((protection: any) => ParseProtectionType(protection));
	streak.Start = FromApiDate(data.Start)
	streak.Count = data.Count ?? 0;

    return streak;
}