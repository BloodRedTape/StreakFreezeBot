import { List } from "@xelene/tgui"
import { CommitSection } from "../components/CommitSection"
import { FreezeSection } from "../components/FreezeSection"
import { Background } from "../core/Background"



export const CommitTab = () => {
	return (
		<Background>
			<List>
				<CommitSection/>
				<FreezeSection/>
			</List>
		</Background>
	)
}