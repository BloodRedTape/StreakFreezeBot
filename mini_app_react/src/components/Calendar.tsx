import { Text, List, Image} from '@xelene/tgui';
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

const GetColorFor = (type: DayType) => {
    switch (type) {
        case DayType.None:
            return ['red', 'white']
        case DayType.Freeze:
            return ['#4da9fa', 'white', 'https://duoplanet.com/wp-content/uploads/2023/02/Duolingo-streak-freeze-1.png']
        case DayType.Commit:
            return ['#f59842', 'white', 'https://i.redd.it/streak-flame-updated-v0-3n46sx7a0e9b1.png?width=283&format=png&auto=webp&s=74253ccd745fc4cf470e99c589921ce4d83c4d10']
        case DayType.Empty:
            return ['white', 'white']
	}
}


const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
    let type: DayType = Math.random() > 0.7 ? DayType.Freeze : DayType.Commit;

    if (day == 0 || day == null)
        type = DayType.Empty;

    const [textColor, imageLink] = GetColorFor(type).splice(1)

    const containerStyle: CSSProperties = {
        position: 'relative',
        display: 'inline-block',
    };

    if (type == DayType.Empty)
        return (<div style={containerStyle}></div>);

    const imageStyle: CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '20%',
	}

    const textStyle: CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: textColor, // Color of the text, ensure it contrasts with the image
        fontWeight: 'bold',
        textAlign: 'center', // Ensure text inside the Text component is centered
    };


    return (
        <List style={ containerStyle }>
            <Image src={ imageLink } style={imageStyle}/>
            <Text weight="3" style={textStyle}>{ day }</Text>
        </List>
    );
};

export const Calendar = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const date = new Date(2024, 8, 0)

    const daysInMonth = date.getDate();
    const startWeekDay = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1) % 7;

    let daysArray = Array(startWeekDay).fill(0).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

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