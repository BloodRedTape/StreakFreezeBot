import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { MakeWebAppLink } from "./Friends";
import { Buffer } from 'buffer';

function stringToBase64(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64');
}

function base64ToString(base64: string): string {
    return Buffer.from(base64, 'base64').toString('utf8');
}

export const MakeChallengeInviteLink = (challengeId: number) => {
    const params = retrieveLaunchParams();

    if (params.initData?.user?.id === undefined)
        return undefined

    const userId = params.initData.user.id

    const hash = stringToBase64(JSON.stringify([userId, challengeId]))

    const command = `challenge_${hash}`
    const link = `${MakeWebAppLink()}?startapp=${command}`

    return link
}

export type ChallengeInviteType = {
    from: number
    challenge: number
}

export const TryParseChallengeInviteLink = () => {
    const params = retrieveLaunchParams();

    if (!params.initData?.startParam?.startsWith('challenge_'))
        return undefined

    const hash = params.initData.startParam.split('_')[1]

    const anyIds = JSON.parse(base64ToString(hash))

    const ids: number[] = anyIds || []

    if (ids.length !== 2)
        return undefined

    const invite: ChallengeInviteType = {
        from: ids[0],
        challenge: ids[1]
    }
    return invite
}