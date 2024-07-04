import { List, Text } from '@xelene/tgui';
import { CSSProperties } from 'react';

type CalendarDayProps = {
    day: number
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
    const isBlue = Math.random() > 0.7;

    const rectColor = isBlue ? '#4da9fa' : '#f59842';

    const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '40px',
    backgroundColor: rectColor,
    borderRadius: '20%', // This makes the rectangle fully rounded / circle
    };

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
    <List>
      <div style={containerStyle}>
        <Text weight="3" style={textStyle}>{ day }</Text>
      </div>
      </List>
  );
};

export const Calendar = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysInMonth = 28; // assuming 4 weeks of 7 days
  let daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Break daysArray into chunks of 7 to represent weeks
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