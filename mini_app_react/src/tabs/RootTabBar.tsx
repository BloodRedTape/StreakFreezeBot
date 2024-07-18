import { Tabbar } from '@xelene/tgui';
import { Icon } from '@xelene/tgui/dist/types/Icon';
import { useState } from 'react';
import { Background } from '../core/Background';
import { FetchUserContext, UserContext, UserContextType } from '../core/UserContext';
import { CommitTab } from './CommitTab';
import { StreakTab } from './StreakTab';

class Tab {
    public Id: number = 0
    public Name: string = ""
    public Icon?: Icon
    public Content?: JSX.Element
}

const tabs: Array<Tab> = [
    {Id: 0, Name: "Streak", Content: <StreakTab/>},
    {Id: 1, Name: "Commit", Content: <CommitTab/>},
    //{Id: 2, Name: "Friends"},
];

const CurrentTab = (Id: number) => {
    return tabs[Id].Content;
}

export const RootTabBar = () => {
    const [currentTab, setCurrentTab] = useState(tabs[0].Id);

    const [userContext, setUserContext] = useState<UserContextType | undefined>(undefined)

    if (userContext == undefined)
        FetchUserContext().then(setUserContext);
    
    return (
        <UserContext.Provider value = {[userContext, setUserContext]}>
            <div>
                {CurrentTab(currentTab)}
                <Background>
                <Tabbar>
                        {tabs.map(({ Id, Name }) => <Tabbar.Item style={{height: '15vh'}} key={Id} text={Name} selected={Id === currentTab} onClick={() => setCurrentTab(Id)}></Tabbar.Item>)}
                </Tabbar>
                </Background>
            </div>
        </UserContext.Provider>
    );
}