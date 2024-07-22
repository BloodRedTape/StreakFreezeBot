import { List } from "@xelene/tgui"
import { CommitSection } from "../components/CommitSection"
import { FreezeSection } from "../components/FreezeSection"

export const CommitTab = () => {
	return (
		<List>
			<CommitSection/>
			<FreezeSection/>
		</List>
	)
}