import { Button, List, Text } from '@xelene/tgui'
import { CSSProperties } from 'react';
import { FetchUserContext, useSetUserContext } from '../core/UserContext';
import { JsonFromResp, PopupFromJson, PostCommit } from '../helpers/Requests';

export const CommitSection = () => {

	const buttonStyle: CSSProperties = {
		margin: '10px',
		display: 'inline-flex',
	}

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
			style={buttonStyle}
			mode="filled"
			onClick={OnCommit}
		>
			Commit
		</Button>
	)

	return (
		<List style={{ display: 'inline', margin: '10px'}}>
			<Text weight="2">Commit</Text>
			<br/>
			{CommitButton}
			<br/>
		</List>
	)
};
