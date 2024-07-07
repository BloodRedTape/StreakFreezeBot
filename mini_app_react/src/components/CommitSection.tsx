import { Button, List } from '@xelene/tgui'
import { CSSProperties, useState } from 'react';
import { useStreakContext } from '../core/StreakContext'



export const CommitSection = () => {
	const [streakContext, setStreakContext] = useStreakContext()

	const [freezed, setFreezed] = useState(false);
	const [commited, setCommited] = useState(false);

	const buttonStyle: CSSProperties = {
		margin: '10px'
	}

	return (
	<List style={{ display: 'inline' }}>
		<List>
			<Button size="l" disabled={ freezed || commited } style={ buttonStyle } mode="filled" onClick={() => {
				setStreakContext({ Days: streakContext.Days + 1 })
				setCommited(true);
			}}>Commit</Button>
			<Button size="l" disabled={freezed || commited} style={buttonStyle} mode="bezeled" onClick={() => {
				setFreezed(true);
			}}>Freeze</Button>
		</List>
		<br/>
		<Button size="l" mode="outline" style={buttonStyle}>Add Freeze</Button>
	</List>)
};
