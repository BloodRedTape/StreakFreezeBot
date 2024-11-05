import { differenceInDays } from "date-fns"
import { FromApiDate } from "./UserContextSerialization"


export enum ChallengeRulesType {
	Unknown,
	Duration
}

export class ChallengeType {
	public Creator: number = 0
	public Type: ChallengeRulesType = 0	
	public Name: string = ""
	public Start: Date = new Date()
	public Duration: number = 0
	public ToDo: Array<string> = []
	public Participants: Array<number> = []

	public IsPending(today: Date): boolean {
		return today < this.Start
	}

	public IsRunning(today: Date): boolean {
		return today >= this.Start && differenceInDays(today, this.Start) < this.Duration
	}
}

export class ChallengeWithPayloadType extends ChallengeType{
	public Id: number = 0
	public Count: number = 0
	public HasLost: boolean = false
	public DayOfChallenge: number = 0
}

export const ParseChallengeWithPayloadType = (data: any): ChallengeWithPayloadType => {
	let challenge = new ChallengeWithPayloadType()
	challenge.Creator = data.Creator ?? -1
	challenge.Type = data.Type === 1 ? ChallengeRulesType.Duration : ChallengeRulesType.Unknown
	challenge.Name = data.Name ?? ""
	challenge.Start = FromApiDate(data.Start)
	challenge.Duration = data.Duration ?? 0
	challenge.ToDo = (data.ToDo || []).map((e: any): string => e)
	challenge.Participants = (data.Participants || []).map((e: any): number => e)
	challenge.Id = data.Id ?? 0
	challenge.Count = data.Count ?? 0
	challenge.HasLost = data.HasLost ?? false
	challenge.DayOfChallenge = data.DayOfChallenge ?? 0
	return challenge 
}

export class ChallengeParticipantType {
	public Id: number = 0	
	public FullName: string = ""
	public Count: number = 0
	public HasLost: boolean = false
}

export const ParseChallengeParticipantType = (data: any): ChallengeParticipantType => {
	let participant = new ChallengeParticipantType()

	participant.Id = data.Id ?? participant.Id
	participant.FullName = data.FullName ?? participant.FullName
	participant.Count = data.Count ?? participant.HasLost
	participant.HasLost = data.HasLost ?? participant.HasLost

    return participant;
}