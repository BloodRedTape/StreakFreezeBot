import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { AppRoot, List } from '@xelene/tgui';
import { useState } from 'react';
import { FriendRequestModal } from './components/FriendRequest';
import { FetchUserContext, UserContext, UserContextType } from './core/UserContext';
import { DebugLog } from './helpers/Debug';
import { TryParseInviteLink } from './helpers/Friends';
import { OnEveryHour } from './helpers/Time';
import { RootTabBar } from './tabs/RootTabBar';

export const App = () => {
    const launchParams = retrieveLaunchParams();

    DebugLog('startParam=' + launchParams.initData?.startParam || "Undefined")

    const [userContext, setUserContext] = useState<UserContextType | undefined>(undefined)

    if (userContext == undefined)
        FetchUserContext().then(setUserContext);

    OnEveryHour(() => {
        FetchUserContext().then(setUserContext);
    })

    window.Telegram?.WebApp.ready()
    window.Telegram?.WebApp.expand()

    return (
        <AppRoot>
            <UserContext.Provider value = {[userContext, setUserContext]}>
                <List style={{ background: 'var(--tg-theme-bg-color)' }}>
                    <FriendRequestModal from={ TryParseInviteLink() }/>
                    <RootTabBar/>
                </List>
            </UserContext.Provider>
        </AppRoot>
    )
}
