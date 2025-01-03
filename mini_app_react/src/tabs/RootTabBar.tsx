import { Tabbar } from '@telegram-apps/telegram-ui';
import { Icon28Stats } from "@telegram-apps/telegram-ui/dist/icons/28/stats"
import { Icon28Chat } from "@telegram-apps/telegram-ui/dist/icons/28/chat"
import { Icon28Heart } from "@telegram-apps/telegram-ui/dist/icons/28/heart"
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
    return tabs[Id].Content
}

export const RootTabBar: React.FC<{ onSetTab: (tab: number) => void, tab: number }> = ({onSetTab, tab}) => {
    return (
        <div>
            <div style={{ overflowY: 'scroll', height: '85vh' }}>
                {CurrentTab(tab)}
            </div>
            <Tabbar style={{height: '15vh'}}>
                {tabs.map(({ Id, Name, Icon }) =>
                    <Tabbar.Item
                        style={{ height: '15vh' }}
                        key={Id}
                        text={Name}
                        selected={Id === tab}
                        onClick={() => onSetTab(Id)}
                    >
                        {Icon}
                    </Tabbar.Item>)}
            </Tabbar>
        </div>
    );
}