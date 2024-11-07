import { GetFriends, JsonFromResp } from "../helpers/Requests"
import { ProtectionType } from "./UserContext"
import { ParseProtectionType } from "./UserContextSerialization"


export class FriendType{
	public Id: number = 0	
	public Streak: number = 0	
	public TodayProtection: ProtectionType = 0	
	public Username: string = ""
	public FullName: string = ""
}

export const ParseFriendType = (data: any): FriendType => {
	const friend = new FriendType();

	friend.Id = data.Id ?? 0
	friend.Streak = data.Streak ?? 0
	friend.TodayProtection = ParseProtectionType(data.TodayProtection)
	friend.Username = data.Username ?? ""
	friend.FullName = data.FullName ?? ""

    return friend;
}


export const FetchFriends = async () => {
	return GetFriends().then(JsonFromResp).then(json => (json || []).map(ParseFriendType))
}