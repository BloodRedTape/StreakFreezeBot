import { retrieveLaunchParams } from "@telegram-apps/sdk-react";


export const MakeInviteLink = () => {
    const params = retrieveLaunchParams();

    if (params.initData?.user?.id === undefined)
        return undefined

    const userId = params.initData.user.id
    const botName = 'test_shit_bot_228_bot'
    const webAppName = 'streak'
    const command = `invite_${userId}`
    const link = `https://t.me/${botName}/${webAppName}?startapp=${command}`

    return link
}

export const TryParseInviteLink = () => {
    const params = retrieveLaunchParams();

    if (!params.initData?.startParam?.startsWith('invite_'))
        return undefined

    const id = params.initData.startParam.split('_')[1]

    return Number(id)
}
