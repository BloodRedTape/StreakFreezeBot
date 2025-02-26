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

export const VisibleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" style={{fill: 'var(--tg-theme-accent-text-color)'} }><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>)

export const NotVisibleIcon = ()=> (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" style={{fill: 'var(--tg-theme-accent-text-color)'} }><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>)

export const DeleteForeverIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" style={{ fill: 'var(--tg-theme-accent-text-color)' }}><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z" /></svg>)

export const Fire28Icon = () => (<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" style={{ color: 'inherit', fill: 'currentcolor'}}><path d="M240-400q0 52 21 98.5t60 81.5q-1-5-1-9v-9q0-32 12-60t35-51l113-111 113 111q23 23 35 51t12 60v9q0 4-1 9 39-35 60-81.5t21-98.5q0-50-18.5-94.5T648-574q-20 13-42 19.5t-45 6.5q-62 0-107.5-41T401-690q-39 33-69 68.5t-50.5 72Q261-513 250.5-475T240-400Zm240 52-57 56q-11 11-17 25t-6 29q0 32 23.5 55t56.5 23q33 0 56.5-23t23.5-55q0-16-6-29.5T537-292l-57-56Zm0-492v132q0 34 23.5 57t57.5 23q18 0 33.5-7.5T622-658l18-22q74 42 117 117t43 163q0 134-93 227T480-80q-134 0-227-93t-93-227q0-129 86.5-245T480-840Z" /></svg>)
export const Public28Icon = () => (<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" style={{ color: 'inherit', fill: 'currentcolor' }}><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-42-68v-80.67q-34.33 0-58.17-25.16Q356-279 356-313.33V-356L155.33-556.67q-4.33 19.34-6.5 38.34-2.16 19-2.16 38.33 0 127 82.83 222T438-148Zm288-106q43-47 65.17-105.17 22.16-58.16 22.16-120.83 0-103.33-56.83-188T604.67-791.33V-774q0 34.33-23.84 59.5-23.83 25.17-58.16 25.17H438v84.66q0 17-12.83 28.17-12.84 11.17-29.84 11.17h-82V-480h252q17 0 28.17 12.5 11.17 12.5 11.17 29.5v124.67h42q28 0 49.66 16.5Q718-280.33 726-254Z" /></svg>)
export const Checklist28Icon = () => (<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" style={{ color: 'inherit', fill: 'currentcolor' }}><path d="m222-209.33-142-142L126.67-398l95 94.33 176-176L444.33-432 222-209.33Zm0-320-142-142L126.67-718l95 94.33 176-176L444.33-752 222-529.33Zm298 242.66v-66.66h360v66.66H520Zm0-320v-66.66h360v66.66H520Z"/></svg>)

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

export const Dot: React.FC<{ size: number | string, color: string }> = ({size, color }) => {
    return (
        <span
            style={{
                height: size,
                width: size,
                backgroundColor: color,
                borderRadius: '50%',
                display: 'inline-block',
                marginTop: 'auto',
                marginBottom: 'auto'
			}}
        />
    )
}
