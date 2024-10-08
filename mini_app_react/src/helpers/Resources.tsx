import { ProtectionType } from "../core/UserContext";

export const GetImageLinkFor = (protection: ProtectionType)=>{
    const colors = new Map<ProtectionType, string>([
        [
            ProtectionType.Freeze,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png'
        ],
        [
            ProtectionType.Commit,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FlameBackground.png'
        ]
    ]);

    return colors.get(protection) ?? ''
}

export const GetFriendStatusImageLinkFor = (protection: ProtectionType)=>{
    const colors = new Map<ProtectionType, string>([
        [
            ProtectionType.Freeze,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png'
        ],
        [
            ProtectionType.Commit,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/SmallFire.png'
        ]
    ]);

    return colors.get(protection) ?? ''
}

export const GetCalendarStatImageLinkFor = (protection: ProtectionType)=>{
    const colors = new Map<ProtectionType, string>([
        [
            ProtectionType.Freeze,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png'
        ],
        [
            ProtectionType.Commit,
            'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/SmallFire.png'
        ]
    ]);

    return colors.get(protection) ?? ''
}

export const GetExtendedStreakFire = () => 'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/SmallFireHighRes.png'
export const GetExtendedStreakBorderColor = ()=> '#FF9600'
export const GetExtendedStreakBackgroundColor = ()=> '#FFB700'