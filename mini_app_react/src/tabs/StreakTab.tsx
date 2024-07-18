import { StreakSection } from "../components/StreakSection"
import { Background } from "../core/Background"

export const StreakTab = () => {
	return (
		<Background>
			<div style={{ padding: '15px'}}>
				<StreakSection />
			</div>
		</Background>
	)
}