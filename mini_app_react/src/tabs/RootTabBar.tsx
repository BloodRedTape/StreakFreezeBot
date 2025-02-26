import { Tabbar } from '@telegram-apps/telegram-ui';
import { CommitTab } from './CommitTab';
import { FriendsTab } from './FriendsTab';
import { StreakTab } from './StreakTab';
import { Checklist28Icon, Fire28Icon, Public28Icon } from '../helpers/Resources';

class Tab {
    public Id: number = 0
    public Name: string = ""
    public Icon?: JSX.Element = undefined
    public Content?: JSX.Element
}

const tabs: Array<Tab> = [
    {Id: 0, Name: "Streak",  Content: <StreakTab/>, Icon:  Fire28Icon() },
    {Id: 1, Name: "Commit",  Content: <CommitTab/>, Icon: Checklist28Icon() },
    {Id: 2, Name: "Friends", Content: <FriendsTab/>, Icon: Public28Icon()},
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