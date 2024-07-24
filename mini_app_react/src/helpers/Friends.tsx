import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

declare global {
  interface Window {
    env: {
      BOT_NAME: string
      WEB_APP_NAME: string
    }
  }
}

export const MakeInviteLink = () => {
    const params = retrieveLaunchParams();

    if (params.initData?.user?.id === undefined)
        return undefined

    const userId = params.initData.user.id
    const botName = window.env.BOT_NAME
    const webAppName = window.env.WEB_APP_NAME
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
