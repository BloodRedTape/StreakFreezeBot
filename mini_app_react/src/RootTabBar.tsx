import { Tabbar, List} from '@xelene/tgui';
import { Icon } from '@xelene/tgui/dist/types/Icon';
import { useState } from 'react';
import { CommitSection } from './components/CommitSection';
import { StreakSection } from './components/StreakSection';
import { StreakContext, StreakContextType } from './core/StreakContext'

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

export const RootTabBar = () => {
    const [currentTab, setCurrentTab] = useState(tabs[0].Id);

    const streakContext = useState<StreakContextType>({Days: 1234})
    
    return (
        <StreakContext.Provider value = {streakContext}>
            <List>
                {CurrentTab(currentTab)}
                <Tabbar>
                    {tabs.map(({ Id, Name }) => <Tabbar.Item key={Id} text={Name} selected={Id === currentTab} onClick={() => setCurrentTab(Id)}></Tabbar.Item>)}
                </Tabbar>
            </List>
        </StreakContext.Provider>
    );
}