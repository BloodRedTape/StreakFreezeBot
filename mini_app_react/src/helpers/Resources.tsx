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