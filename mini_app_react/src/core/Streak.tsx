import { differenceInDays, getDaysInMonth } from "date-fns"
import { ProtectionType } from "./UserContext"
import { FromApiDate, ParseProtectionType } from "./UserContextSerialization"


export class StreakType{
	public Description: string = ""
	public History: Array<ProtectionType> = []
	public Start: Date = new Date(0, 0, 0)
	public Count: number = 0
	public Id: number = -1
	public Challenge: number = -1
	public Required: boolean = false
	public Freezable: boolean = false

	public ProtectionAt(date: Date): ProtectionType{
		const index = differenceInDays(date, this.Start)

		return this.History[index] ?? ProtectionType.None
	}

	public IsProtectedAt(date: Date): boolean {
		return this.ProtectionAt(date) !== ProtectionType.None
	}

	public IsRequired(): boolean {
		return this.Required
	}
	public IsOptional(): boolean {
		return !this.IsRequired()
	}

	public HasEverProtected(): boolean {
		for (let day of this.History) {
			if (day !== ProtectionType.None)
				return true;
		}

		return false;
	}

	public CountProtectionsInMonth(anchor: Date, protection: ProtectionType): number{
		let count = 0;

		for (let i = 0; i < getDaysInMonth(anchor); i++) {
			const date = new Date(anchor.getFullYear(), anchor.getMonth(), i + 1);

			count += this.ProtectionAt(date) == protection ? 1 : 0;
		}

		return count;
	}

	public IsChallenge(): boolean {
		return this.Challenge !== -1 && this.Challenge !== 0
	}

};


export const ParseStreakType = (data: any): StreakType => {
	const streak = new StreakType();

	streak.Description = data.Description ?? ""
	streak.History = (data.History || []).map((protection: any) => ParseProtectionType(protection));
	streak.Start = FromApiDate(data.Start)
	streak.Count = data.Count ?? 0;
	streak.Id = data.Id ?? -1
	streak.Challenge = data.Challenge ?? -1
	streak.Required = data.Required ?? false
	streak.Freezable = data.Freezable ?? false

    return streak;
}