import { Breadcrumbs, Cell, IconButton, List, Section, Text } from '@xelene/tgui';
import { BreadCrumbsItem } from '@xelene/tgui/dist/components/Navigation/Breadcrumbs/components/BreadCrumbsItem/BreadCrumbsItem';
import { Icon24ChevronLeft } from '@xelene/tgui/dist/icons/24/chevron_left';
import { Icon24ChevronRight } from '@xelene/tgui/dist/icons/24/chevron_right';
import { addMonths, differenceInDays } from 'date-fns';
import { CSSProperties, ReactNode } from 'react';
import { Img } from '../core/Img';
import { ProtectionAt, ProtectionType, useGetUserContext } from '../core/UserContext';
import { GetImageLinkFor } from '../helpers/Resources';

enum DayType{
    NotADay,
    None,
    Freeze,
    Commit
}

type CalendarDayProps = {
    day: number
    type: DayType
    today: boolean
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
            ['#4da9fa', 'white', GetImageLinkFor(ProtectionType.Freeze)]
        ],
        [
            DayType.Commit,
            ['#f59842', 'white', GetImageLinkFor(ProtectionType.Commit)]
        ]
    ]);

    return colors.get(type) ?? ["", "", ""];
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, type, today }) => {
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
        color: today ? 'black' : textColor, // Color of the text, ensure it contrasts with the image
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
    year: number,
    history: ProtectionType[],
    start: Date
}


const ProtectionToDayType = (protection: ProtectionType) => {
    const map = new Map<ProtectionType, DayType>([
        [ProtectionType.Commit, DayType.Commit],
        [ProtectionType.Freeze, DayType.Freeze],
        [ProtectionType.None, DayType.None],
    ])

    return map.get(protection) ?? DayType.NotADay
}

export const GetAnchorDate = () => {
	const date = new Date(Date.now())

	return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const Calendar = (props: CalendarProps) => {
    const userContext = useGetUserContext()

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
        <th key={index}><Text weight="2">{day}</Text></th>
    )

    const Headings = (
        <tr> {daysOfWeek.map(MakeHeadings)} </tr>
    )

    const DetectDayType = (day: number) => {
        return day === 0
            ? DayType.NotADay
            : ProtectionToDayType(
                ProtectionAt(
                    new Date(date.getFullYear(), date.getMonth(), day),
                    props.history,
                    props.start
                )
            )
    }

    const MakeDay = (day: any) => {
        const isToday = differenceInDays(userContext?.Today ?? new Date(0, 0, 0), new Date(props.year, props.month - 1, day)) == 0

        return (
            <td><CalendarDay day={day} today={isToday} type={ DetectDayType(day) }/></td>
        )
	}

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

export const CalendarWithSelector: React.FC<{history: ProtectionType[], start: Date, today: Date, onDateChanged: (date: Date)=>void, afterSelector?: ReactNode}> = ({ history, start, today, onDateChanged, afterSelector }) => {

	const monthNames = [
		"January", "February", "March", "April", "May", "June(gay)",
		"July", "August", "September", "October", "November", "December"
    ];

    let monthIndex = today.getMonth()
	let month = monthIndex + 1
	let year = today.getFullYear()
	let monthName = monthNames[monthIndex]

	const SelectorTextStyle: CSSProperties = {
		display: 'inline-block',
		marginTop: 'auto',
		marginBottom: 'auto',
	}

	const SelectorControlsStyle: CSSProperties = {
		display: 'inline-block',
		marginLeft: 'auto',
		marginRight: '0'
	}

	const SelectorStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center'
	}

	const MonthSelector = (
		<div style={SelectorStyle}>
			<Text style={SelectorTextStyle} weight="2">{monthName} {year}</Text>
			<div style={SelectorControlsStyle}>
				<IconButton style={{marginRight: '10px'}} size="s" onClick={ ()=>onDateChanged(addMonths(today,-1)) }><Icon24ChevronLeft/></IconButton>
				<IconButton size="s" onClick={ ()=>onDateChanged(addMonths(today, 1)) }><Icon24ChevronRight/></IconButton>
			</div>
		</div>
    )

    return (
        <div>
			<div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
                {MonthSelector}
                {afterSelector}
			</div>
            <Calendar year={year} month={month} history={history} start={start}/>
        </div>
    )
}

export const MonthStats: React.FC<{ stats: [string, number][] }> = ({stats}) => {
	const MonthStatsStyle: CSSProperties = {
		display: 'inline-block',
		paddingLeft: 'auto',
		paddingRight: 'auto',
		marginLeft: 'auto',
		marginRight: 'auto',
	}

	return (
		<div style={MonthStatsStyle}>
			<Breadcrumbs >
			{stats.map((pair) => 
				(<BreadCrumbsItem >
					<List>
						<Text weight="2">{pair[0]}</Text>
						<br/>
						<Text weight="3">{pair[1]} Days</Text>
					</List>
				</BreadCrumbsItem>)
			)}
			</Breadcrumbs>
		</div>
	)
}