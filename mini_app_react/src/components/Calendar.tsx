import { Text } from '@xelene/tgui';
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
    switch (type) {
        case DayType.None:
            return ['white', 'var(--tg-theme-subtitle-text-color)', ""]
        case DayType.Freeze:
            return ['#4da9fa', 'white', 'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FreezeBackground.png']
        case DayType.Commit:
            return ['#f59842', 'white', 'https://raw.githubusercontent.com/BloodRedTape/StreakFreezeBot/master/resources/FlameBackground.png']
        case DayType.NotADay:
        default:
            return ['white', 'white', ""]
	}
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, type }) => {
    const [textColor, imageLink] = GetColorFor(type).splice(1)

    const containerStyle: CSSProperties = {
        position: 'relative',
    };

    if (type == DayType.NotADay)
        return (<div style={containerStyle}></div>);

    const imageStyle: CSSProperties = {
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
    switch (protection) {
        case ProtectionType.Commit:
            return DayType.Commit
        case ProtectionType.Freeze:
            return DayType.Freeze
        case ProtectionType.None:
        default:
            return DayType.None
	}
}

const GetDayTypeFor = (date: Date) => {
    const userContext = useGetUserContext()

    if (userContext == undefined)
        return DayType.NotADay

    return ProtectionToDayType(userContext.ProtectionAt(date))
}

export const Calendar = (props: CalendarProps) => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const date = new Date(props.year, props.month, 0)

    const daysInMonth = date.getDate();
    let startWeekDay = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1) % 7;

    startWeekDay = startWeekDay < 0 ? 0 : startWeekDay

    let daysArray = Array(startWeekDay).fill(0).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

    const weeks = [];
    while (daysArray.length > 0) {
        weeks.push(daysArray.splice(0, 7));
    }

    return (
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
                <tr>
                    {daysOfWeek.map((day, index) => (
                        <th key={index}><Text weight="3">{day}</Text></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {weeks.map((week, index) => (
                    <tr key={index}>
                        {week.map(day => (
                            <td><CalendarDay day={day} type={ day == 0 ? DayType.NotADay : GetDayTypeFor(new Date(date.getFullYear(), date.getMonth(), day)) }/></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};