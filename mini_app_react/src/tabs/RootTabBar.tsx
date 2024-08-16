import { Tabbar } from '@xelene/tgui';
import { Icon28Stats } from "@xelene/tgui/dist/icons/28/stats"
import { Icon28Chat } from "@xelene/tgui/dist/icons/28/chat"
import { Icon28Heart } from "@xelene/tgui/dist/icons/28/heart"
import { useState } from 'react';
import { CommitTab } from './CommitTab';
import { FriendsTab } from './FriendsTab';
import { StreakTab } from './StreakTab';

class Tab {
    public Id: number = 0
    public Name: string = ""
    public Icon?: JSX.Element = undefined
    public Content?: JSX.Element
}

const tabs: Array<Tab> = [
    {Id: 0, Name: "Streak",  Content: <StreakTab/>, Icon:  <Icon28Stats /> },
    {Id: 1, Name: "Commit",  Content: <CommitTab/>, Icon: <Icon28Heart/> },
    {Id: 2, Name: "Friends", Content: <FriendsTab/>, Icon: <Icon28Chat/>},
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
            <Tabbar style={{height: '15vh'}}>
                {tabs.map(({ Id, Name, Icon }) =>
                    <Tabbar.Item
                        style={{ height: '15vh' }}
                        key={Id}
                        text={Name}
                        selected={Id === currentTab}
                        onClick={() => setCurrentTab(Id)}
                    >
                        {Icon}
                    </Tabbar.Item>)}
            </Tabbar>
        </div>
    );
}