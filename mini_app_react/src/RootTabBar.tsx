import { Tabbar, List } from '@xelene/tgui';
import { Icon } from '@xelene/tgui/dist/types/Icon';
import { useEffect, useState } from 'react';
import { CommitSection } from './components/CommitSection';
import { StreakSection } from './components/StreakSection';
import { UserContext, ParseUserContextType, UserContextType } from './core/UserContext'
import { retrieveLaunchParams } from '@telegram-apps/sdk';

class Tab {
    public Id: number = 0
    public Name: string = ""
    public Icon?: Icon
    public Content?: JSX.Element
}

const tabs: Array<Tab> = [
    {Id: 0, Name: "Streak", Content: <StreakSection/>},
    {Id: 1, Name: "Commit", Content: <CommitSection/>},
    //{Id: 2, Name: "Friends"},
];

const CurrentTab = (Id: number) => {
    return tabs[Id].Content;
}

const FetchUserContext = async () => {
    const launchParams = retrieveLaunchParams();

    const resp = await fetch(window.location.origin + '/user/' + launchParams.initData?.user?.id)

    return ParseUserContextType(await resp.json())
}

export const RootTabBar = () => {
    const [currentTab, setCurrentTab] = useState(tabs[0].Id);

    const [userContext, setUserContext] = useState<UserContextType>(new UserContextType())

    useEffect(() => {
        FetchUserContext().then((value) => {
            setUserContext(value)
		})
	})
    
    return (
        <UserContext.Provider value = {[userContext, setUserContext]}>
            <List>
                {CurrentTab(currentTab)}
                <Tabbar>
                    {tabs.map(({ Id, Name }) => <Tabbar.Item key={Id} text={Name} selected={Id === currentTab} onClick={() => setCurrentTab(Id)}></Tabbar.Item>)}
                </Tabbar>
            </List>
        </UserContext.Provider>
    );
}