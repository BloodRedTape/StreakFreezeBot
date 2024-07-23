import { Tabbar } from '@xelene/tgui';
import { Icon } from '@xelene/tgui/dist/types/Icon';
import { useState } from 'react';
import { CommitTab } from './CommitTab';
import { FriendsTab } from './FriendsTab';
import { StreakTab } from './StreakTab';

class Tab {
    public Id: number = 0
    public Name: string = ""
    public Icon?: Icon
    public Content?: JSX.Element
}

const tabs: Array<Tab> = [
    {Id: 0, Name: "Streak",  Content: <StreakTab/>},
    {Id: 1, Name: "Commit",  Content: <CommitTab/>},
    {Id: 2, Name: "Friends", Content: <FriendsTab/>},
];

const CurrentTab = (Id: number) => {
    return tabs[Id].Content;
}

export const RootTabBar = () => {
    const [currentTab, setCurrentTab] = useState(tabs[0].Id);

    return (
        <div>
            <div style={{ overflowY: 'scroll', height: '85vh' }}>
                {CurrentTab(currentTab)}
            </div>
            <Tabbar>
                    {tabs.map(({ Id, Name }) => <Tabbar.Item style={{height: '15vh'}} key={Id} text={Name} selected={Id === currentTab} onClick={() => setCurrentTab(Id)}></Tabbar.Item>)}
            </Tabbar>
        </div>
    );
}