import { GetGlobalConfigImpl } from "./config"

export interface GlobalConfig {
     BotName: string
     WebAppName: string
     WebAppLogging?: boolean
}

export const GetGlobalConfig = () => {
    return GetGlobalConfigImpl()
}

