import { Button, Text } from '@xelene/tgui'
import { FetchUserContext, useSetUserContext } from '../core/UserContext';
import { JsonFromResp, PopupFromJson, PostCommit } from '../helpers/Requests';

export const CommitSection = () => {

	const setUserContext = useSetUserContext()

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const CanCommit = true;

	const OnCommit = () => {
		PostCommit().then(JsonFromResp).then(PopupFromJson).then(Refresh);
	}

	const CommitButton = (
		<Button
			size="l"
			disabled={!CanCommit}
			stretched
			mode="filled"
			onClick={OnCommit}
		>
			Commit
		</Button>
	)

	return (
		<div>
			<Text weight="2">Commit</Text>
			<br/>
			<br/>
			{CommitButton}
		</div>
	)
};
