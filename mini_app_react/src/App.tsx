import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { AppRoot } from '@xelene/tgui';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { FriendRequestModal } from './components/FriendRequest';
import { FetchUserContext, UserContext, UserContextType } from './core/UserContext';
import { DebugLog } from './helpers/Debug';
import { TryParseInviteLink } from './helpers/Friends';
import { OnEveryHour } from './helpers/Time';
import { RootTabBar } from './tabs/RootTabBar';
import { NextUIProvider } from "@nextui-org/react";
import { NavigateFunction, Route, Routes, useHref, useLocation, useNavigate } from 'react-router';
import { ChallengeInfoPage } from './components/ChallengeInfo';
import { ChallengeInput } from './components/ChallengeInput';
import { StreakInfoPage } from './components/StreakInfo';
import { StreakEdit } from './components/StreakEdit';
import { ChallengesSection } from './components/ChallengesSection';
import { FreezePage } from './components/FreezeSection';
import { ChallengeInviteModal } from './components/ChallengeInvite';
import { TryParseChallengeInviteLink } from './helpers/Challenges';

const queryClient = new QueryClient();

const Page: React.FC<React.PropsWithChildren> = ({children}) => {
    return (
        <div style={{ height: '100vh', overflowY: 'scroll' }}>
            {children }
        </div>
    )
}

export const navigateBack = (navigate: NavigateFunction) => {
    const segments = window.location.pathname.split('/').filter(Boolean);

    if (!segments.length) {
        navigate('/')
        return
    }


    const id = Number(segments.pop());

    if (!isNaN(id) && segments.length)
        segments.pop()

    navigate(`/${segments.join('/')}`);
}

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

    document.body.style.overflow = "hidden"

    const [tab, setTab] = useState<number>(0)

    const ActualAppContent = (
            <div>
                <FriendRequestModal from={TryParseInviteLink()} />
                <ChallengeInviteModal invite={TryParseChallengeInviteLink()} />
                <RootTabBar onSetTab={setTab} tab={tab}/>
            </div>
    )

    const navigate = useNavigate();

    window.Telegram?.WebApp.BackButton.onClick(() => {
        navigateBack(navigate)
    })

    const location = useLocation();

    useEffect(() => {
        if (location.pathname == '/')
            window.Telegram?.WebApp.BackButton.hide()
        else
            window.Telegram?.WebApp.BackButton.show()

    }, [location.pathname]);

    return (
        <NextUIProvider navigate={navigate} useHref={useHref} locale="en-GB">
            <main className={`${window.Telegram?.WebApp.colorScheme ?? "light"} text-foreground bg-background`}>
                <QueryClientProvider client={queryClient}>
                    <UserContext.Provider value={[userContext, setUserContext]}>
                        <AppRoot>
                            <Routes>
                                <Route path="/" element={ActualAppContent} />
                                <Route path="/streak/:id" element={<Page><StreakInfoPage/></Page>} />
                                <Route path="/edit_streaks" element={<Page><StreakEdit /></Page>} />

                                <Route path="/challenge/:id" element={<Page><ChallengeInfoPage /></Page>} />

                                <Route path="/edit_challenges" element={<Page><ChallengesSection/></Page>} />
                                <Route path="/edit_challenges/challenge/:id" element={<Page><ChallengeInfoPage/></Page>} />
                                <Route path="/edit_challenges/new_challenge" element={<Page><ChallengeInput /></Page>} />

                                <Route path="/edit_freezes" element={<Page><FreezePage/></Page>} />
                            </Routes>
                        </AppRoot>
                    </UserContext.Provider>
                </QueryClientProvider>
            </main>
        </NextUIProvider>
    )
}
