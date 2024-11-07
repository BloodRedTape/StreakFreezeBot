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
export const GetExtendedStreakBackgroundColor = () => '#FFB700'


export const ShareIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox={`0 0 24 24`}
        style={{fill: 'var(--tg-theme-accent-text-color)'} }
    >
    <g data-name="Layer 2">
      <g data-name="link-2">
        <path d="m13.29 9.29-4 4a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4-4a1 1 0 0 0-1.42-1.42"></path>
        <path d="M12.28 17.4 11 18.67a4.2 4.2 0 0 1-5.58.4 4 4 0 0 1-.27-5.93l1.42-1.43a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-1.27 1.28a6.15 6.15 0 0 0-.67 8.07 6.06 6.06 0 0 0 9.07.6l1.42-1.42a1 1 0 0 0-1.42-1.42M19.66 3.22a6.18 6.18 0 0 0-8.13.68L10.45 5a1.09 1.09 0 0 0-.17 1.61 1 1 0 0 0 1.42 0L13 5.3a4.17 4.17 0 0 1 5.57-.4 4 4 0 0 1 .27 5.95l-1.42 1.43a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.42-1.42a6.06 6.06 0 0 0-.6-9.06"></path>
      </g>
    </g>
    </svg>
);
