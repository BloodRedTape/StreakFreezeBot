import { Button, List } from '@xelene/tgui'
import { CSSProperties, useState } from 'react';
import { FetchUserContext, useSetUserContext } from '../core/UserContext';
import { MakeUserRequestLocation } from '../helpers/Requests';


export const CommitSection = () => {

	const [freezed, setFreezed] = useState(false);

	const buttonStyle: CSSProperties = {
		margin: '10px'
	}

	const setUserContext = useSetUserContext()

	return (
	<List style={{ display: 'inline' }}>
		<List>
			<Button size="l" disabled={freezed} style={buttonStyle} mode="filled" onClick={() => {
					fetch(MakeUserRequestLocation() + '/commit', { method: 'POST' }).then(() => FetchUserContext().then(setUserContext));
			}}>Commit</Button>
			<Button size="l" disabled={freezed} style={buttonStyle} mode="bezeled" onClick={() => {
				setFreezed(true);
			}}>Freeze</Button>
		</List>
		<br/>
		<Button size="l" mode="outline" style={buttonStyle}>Add Freeze</Button>
	</List>)
};
