import { Text } from '@xelene/tgui';
import { CSSProperties } from 'react';

type CalendarDayProps = {
    day: number
}

enum DayType{
    Empty,
    None,
    Freeze,
    Commit
}

const GetColorFor = (type: DayType)=>{
    switch (type) {
        case DayType.None:
            return 'red'
        case DayType.Freeze:
            return '#4da9fa'
        case DayType.Commit:
            return '#f59842'
        case DayType.Empty:
            return 'white'
	}
}


const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
    let type: DayType = Math.random() > 0.7 ? DayType.Freeze : DayType.Commit;

    if (day == 0 || day == null)
        type = DayType.Empty;

    const containerStyle: CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        width: '40px',
        height: '40px',
        backgroundColor: GetColorFor(type),
        borderRadius: '20%',
    };

    if (type == DayType.Empty)
        return (<div style={ containerStyle }></div>);

    const textStyle: CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white', // Color of the text, ensure it contrasts with the image
        fontWeight: 'bold',
        textAlign: 'center', // Ensure text inside the Text component is centered
    };

    return (
        <div style={containerStyle}>
            <Text weight="3" style={textStyle}>{ day }</Text>
        </div>
    );
};

export const Calendar = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const date = new Date(2024, 8, 0)

    const daysInMonth = date.getDate();
    const startWeekDay = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1) % 7;

    let daysArray = new Array(startWeekDay).fill(0).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

    const weeks = [];
    while (daysArray.length > 0) {
        weeks.push(daysArray.splice(0, 7));
    }

    return (
        <table>
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
                            <td><CalendarDay day={ day }/></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};