import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { GetGlobalConfig } from "../config_declaration";

export const MakeWebAppLink = () => {
    const config = GetGlobalConfig()
    const botName = config.BotName 
    const webAppName = config.WebAppName 

    return `https://t.me/${botName}/${webAppName}`
}

export const MakeInviteLink = () => {
    const params = retrieveLaunchParams();

    if (params.initData?.user?.id === undefined)
        return undefined

    const userId = params.initData.user.id
    const command = `invite_${userId}`
    const link = `${MakeWebAppLink()}?startapp=${command}`

    return link
}

export const TryParseInviteLink = () => {
    const params = retrieveLaunchParams();

    if (!params.initData?.startParam?.startsWith('invite_'))
        return undefined

    const id = params.initData.startParam.split('_')[1]

    return Number(id)
}
