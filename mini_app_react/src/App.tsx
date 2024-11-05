import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { AppRoot } from '@xelene/tgui';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { FriendRequestModal } from './components/FriendRequest';
import { FetchUserContext, UserContext, UserContextType } from './core/UserContext';
import { DebugLog } from './helpers/Debug';
import { TryParseInviteLink } from './helpers/Friends';
import { BackgroundColor } from './helpers/Theme';
import { OnEveryHour } from './helpers/Time';
import { RootTabBar } from './tabs/RootTabBar';
import { NextUIProvider } from "@nextui-org/react";
import { Route, Routes, useHref, useLocation, useNavigate } from 'react-router';
import { ChallengeInfoPage } from './components/ChallengeInfo';
import { ChallengeInput } from './components/ChallengeInput';

const queryClient = new QueryClient();

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
                <RootTabBar onSetTab={setTab} tab={tab}/>
            </div>
    )

    const navigate = useNavigate();

    window.Telegram?.WebApp.BackButton.onClick(() => {
        navigate(-1)
    })

    const location = useLocation();

    useEffect(() => {
        if (location.pathname == '/')
            window.Telegram?.WebApp.BackButton.hide()
        else
            window.Telegram?.WebApp.BackButton.show()

    }, [location.pathname]);

    return (
        <div style={{ background: BackgroundColor(), height: '100vh'}}>
        <QueryClientProvider client={queryClient}>
            <UserContext.Provider value={[userContext, setUserContext]}>
                <NextUIProvider navigate={navigate} useHref={useHref}>
                    <main className={`${window.Telegram?.WebApp.colorScheme ?? "light"} text-foreground bg-background`}>
                        <AppRoot>
                            <Routes>
                                <Route path="/" element={ActualAppContent} />
                                <Route path="/new_challenge" element={<ChallengeInput/>} />
                                <Route path="/challenge/:id" element={<ChallengeInfoPage/>} />
                            </Routes>
                        </AppRoot>
                    </main>
                </NextUIProvider>
            </UserContext.Provider>
        </QueryClientProvider>
        </div>
    )
}
