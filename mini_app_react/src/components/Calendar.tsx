import { Cell, Section, Text } from '@xelene/tgui';
import { CSSProperties } from 'react';
import { Img } from '../core/Img';
import { ProtectionType, useGetUserContext } from '../core/UserContext';

enum DayType{
    NotADay,
    None,
    Freeze,
    Commit
}

type CalendarDayProps = {
    day: number
    type: DayType
}

const GetColorFor = (type: DayType) => {
    const colors = new Map<DayType, Array<string>>([
        [
            DayType.NotADay,
            ['white', 'white', ""]
        ],
        [
            DayType.None,
            ['white', 'var(--tg-theme-subtitle-text-color)', ""]
        ],
        [
            DayType.Freeze,
            ['#4da9fa', 'white', 'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png']
        ],
        [
            DayType.Commit,
            ['#f59842', 'white', 'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FlameBackground.png']
        ]
    ]);

    return colors.get(type) ?? ["", "", ""];
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, type }) => {
    const [textColor, imageLink] = GetColorFor(type).splice(1)

    const containerStyle: CSSProperties = {
        position: 'relative',
    };

    const imageStyle: CSSProperties = {
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '40px',
        height: '40px',
        border: '0px',
        outline: '0px',
        background: '#FFFFFF00',
    }

    const textDivStyle: CSSProperties = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
	}

    const textStyle: CSSProperties = {
        color: textColor, // Color of the text, ensure it contrasts with the image
        fontWeight: 'bold',
        textAlign: 'center', // Ensure text inside the Text component is centered
    };

    if (type == DayType.NotADay)
        return (<div style={containerStyle}></div>);

    return (
        <div style={ containerStyle }>
            <Img src={imageLink} style={imageStyle} /> 
            <div style={textDivStyle}>
                <Text weight="3" style={textStyle}>{ day }</Text>
            </div>
        </div>
    );
};

export type CalendarProps = {
    month: number,
    year: number
}


const ProtectionToDayType = (protection: ProtectionType) => {
    const map = new Map<ProtectionType, DayType>([
        [ProtectionType.Commit, DayType.Commit],
        [ProtectionType.Freeze, DayType.Freeze],
        [ProtectionType.None, DayType.None],
    ])

    return map.get(protection) ?? DayType.NotADay
}

const GetDayTypeFor = (date: Date) => {
    const userContext = useGetUserContext()

    if (userContext == undefined)
        return DayType.NotADay

    return ProtectionToDayType(userContext.ProtectionAt(date))
}

export const Calendar = (props: CalendarProps) => {
    const daysOfWeek = [
        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    ];

    const date = new Date(props.year, props.month, 0)

    const daysInMonth = date.getDate();
    let startWeekDay = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1) % 7;

    startWeekDay = startWeekDay < 0 ? 0 : startWeekDay

    let daysArray = Array(startWeekDay).fill(0).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

    const weeks = [];
    while (daysArray.length > 0) {
        weeks.push(daysArray.splice(0, 7));
    }

    const MakeHeadings = (day: string, index: number) => (
         <th key={index}><Text weight="3">{day}</Text></th>
    )

    const Headings = (
        <tr> {daysOfWeek.map(MakeHeadings)} </tr>
    )

    const DetectDayType = (day: number) => {
        return day === 0 ? DayType.NotADay : GetDayTypeFor(new Date(date.getFullYear(), date.getMonth(), day))
    }

    const MakeDay = (day: any) => (
        <td><CalendarDay day={day} type={ DetectDayType(day) }/></td>
    )

    const MakeRow = (week: any[], index: number) => (
        <tr key={index}> {week.map(MakeDay)} </tr>
    )

    return (
        <Section>
            <Cell style={{background: 'var(--tg-theme-header-bg-color)'}}>
                <table style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead> { Headings } </thead>
                    <tbody> { weeks.map(MakeRow) } </tbody>
                </table>
            </Cell>
        </Section>
    );
};