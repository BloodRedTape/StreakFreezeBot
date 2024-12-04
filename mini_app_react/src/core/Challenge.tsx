import { FromApiDate } from "./UserContextSerialization"


export enum ChallengeRulesType {
	Unknown,
	Duration
}

export class ChallengeType {
	public Creator: number = 0
	public Type: ChallengeRulesType = 0	
	public Name: string = ""
	public Icon: string = "😆"
	public IconBackground: string = "white"
	public Start: Date = new Date()
	public Duration: number = 0
	public ToDo: Array<string> = []
	public Participants: Array<number> = []

	public IsMinified(): boolean {
		return this.ToDo.length === 1 && this.ToDo[0] === this.Name;
	}
}

export enum ChallengeStatusType {
	Pending,
	Running,
	Finished
}

const ParseChallengeStatusType = (data: any) => {
	if (data === 0)	
		return ChallengeStatusType.Pending
	if (data === 1)	
		return ChallengeStatusType.Running

	return ChallengeStatusType.Finished
}

export class ChallengeWithPayloadType extends ChallengeType{
	public Id: number = 0
	public Count: number = 0
	public HasLost: boolean = false
	public DayOfChallenge: number = 0
	public CanJoin: boolean = false
	public Status: ChallengeStatusType = ChallengeStatusType.Pending

	public IsPending(): boolean {
		return this.Status === ChallengeStatusType.Pending
	}

	public IsRunning(): boolean {
		return this.Status === ChallengeStatusType.Running
	}

	public IsFinished(): boolean {
		return this.Status === ChallengeStatusType.Finished
	}
}

export const ParseChallengeWithPayloadType = (data: any): ChallengeWithPayloadType => {
	let challenge = new ChallengeWithPayloadType()
	challenge.Creator = data.Creator ?? -1
	challenge.Type = data.Type === 1 ? ChallengeRulesType.Duration : ChallengeRulesType.Unknown
	challenge.Name = data.Name ?? ""
	challenge.Icon = data.Icon ?? challenge.Icon
	challenge.IconBackground = data.IconBackground ?? challenge.IconBackground
	challenge.Start = FromApiDate(data.Start)
	challenge.Duration = data.Duration ?? 0
	challenge.ToDo = (data.ToDo || []).map((e: any): string => e)
	challenge.Participants = (data.Participants || []).map((e: any): number => e)
	challenge.Id = data.Id ?? 0
	challenge.Count = data.Count ?? 0
	challenge.HasLost = data.HasLost ?? false
	challenge.DayOfChallenge = data.DayOfChallenge ?? 0
	challenge.CanJoin = data.CanJoin ?? false
	challenge.Status = ParseChallengeStatusType(data.Status)
	return challenge 
}

export class ChallengeParticipantType {
	public Id: number = 0	
	public FullName: string = ""
	public Username: string = ""
	public Count: number = 0
	public HasLost: boolean = false
}

export const ParseChallengeParticipantType = (data: any): ChallengeParticipantType => {
	let participant = new ChallengeParticipantType()

	participant.Id = data.Id ?? participant.Id
	participant.FullName = data.FullName ?? participant.FullName
	participant.Username = data.Username ?? participant.Username
	participant.Count = data.Count ?? participant.HasLost
	participant.HasLost = data.HasLost ?? participant.HasLost

    return participant;
}