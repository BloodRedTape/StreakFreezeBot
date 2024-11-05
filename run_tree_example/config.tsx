import { GlobalConfig } from "./config_declaration"

export const GetGlobalConfigImpl = (): GlobalConfig => {
    const config: GlobalConfig = {
        BotName: 'test_shit_bot_228_bot',
        WebAppName: 'streak'
    };

    return config
}