import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

const GatherCurrentUserId = (): number => {
	const debugId = 399828804
	try {
		const launchParams = retrieveLaunchParams();
		return launchParams.initData?.user?.id ?? debugId;
	} catch (e) {
		return debugId;
	}
}

export const MakeUserRequestLocation = () => {
    return window.location.origin + '/user/' + GatherCurrentUserId()
}