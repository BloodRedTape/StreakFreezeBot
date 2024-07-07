import { Button, List } from '@xelene/tgui'
import { useStreakContext } from '../core/StreakContext'



export const CommitSection = () => {
	const [streakContext, setStreakContext] = useStreakContext()

	return (<List>
		<Button size="l" onClick={() => setStreakContext({ Days: streakContext.Days + 1 })}>Commit</Button>
	</List>)
};
