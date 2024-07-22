import { CommitSection } from "../components/CommitSection"
import { FreezeSection } from "../components/FreezeSection"

export const CommitTab = () => {
	return (
		<div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
			<CommitSection />
			<br/>
			<FreezeSection/>
		</div>
	)
}