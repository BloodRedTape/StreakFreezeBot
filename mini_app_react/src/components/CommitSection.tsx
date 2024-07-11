import { Button, List } from '@xelene/tgui'
import { CSSProperties } from 'react';
import { Background } from '../core/Background';
import { FetchUserContext, useSetUserContext } from '../core/UserContext';
import { MakeUserRequestLocation } from '../helpers/Requests';


export const CommitSection = () => {

	const buttonStyle: CSSProperties = {
		margin: '10px'
	}

	const setUserContext = useSetUserContext()

	const Refresh = () => FetchUserContext().then(setUserContext)

	return (
		<Background>
		<List style={{ display: 'inline' }}>
			<List>
				<Button size="l" disabled={false} style={buttonStyle} mode="filled" onClick={() => {
					fetch(MakeUserRequestLocation() + '/commit', { method: 'POST' }).then(Refresh);
				}}>Commit</Button>
				<Button size="l" disabled={false} style={buttonStyle} mode="bezeled" onClick={() => {
					fetch(MakeUserRequestLocation() + '/use_freeze', { method: 'POST' }).then(Refresh);
				}}>Freeze</Button>
			</List>
			<br/>
			<Button size="l" mode="outline" style={buttonStyle} onClick={() => {
				fetch(MakeUserRequestLocation() + '/add_freeze', { method: 'POST' }).then(Refresh);
			}}>Add Freeze</Button>
		</List>
		</Background>
	)
};
