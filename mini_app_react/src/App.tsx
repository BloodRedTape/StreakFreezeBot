import { AppRoot, List } from '@xelene/tgui';
import { RootTabBar } from './tabs/RootTabBar';



export const App = () => (
    <AppRoot>
        <List style={{background: 'var(--tg-theme-bg-color)'}}>
            <RootTabBar/>
        </List>
    </AppRoot>
);
