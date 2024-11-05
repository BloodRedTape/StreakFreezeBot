import { GetGlobalConfigImpl } from "./config"

export interface GlobalConfig {
     BotName: string
     WebAppName: string
}

export const GetGlobalConfig = () => {
    return GetGlobalConfigImpl()
}
