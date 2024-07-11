import { Text, Image} from '@xelene/tgui';
import { CSSProperties } from 'react';
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
            return ['white', 'white', ""]
        case DayType.Freeze:
            return ['#4da9fa', 'white', 'https://duoplanet.com/wp-content/uploads/2023/02/Duolingo-streak-freeze-1.png']
        case DayType.Commit:
            return ['#f59842', 'white', 'https://i.redd.it/streak-flame-updated-v0-3n46sx7a0e9b1.png?width=283&format=png&auto=webp&s=74253ccd745fc4cf470e99c589921ce4d83c4d10']
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
        borderRadius: '20%',
	}

    const textStyle: CSSProperties = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        color: textColor, // Color of the text, ensure it contrasts with the image
        fontWeight: 'bold',
        textAlign: 'center', // Ensure text inside the Text component is centered
    };


    return (
        <div style={ containerStyle }>
            <Image src={ imageLink } style={imageStyle}/>
            <Text weight="3" style={textStyle}>{ day }</Text>
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