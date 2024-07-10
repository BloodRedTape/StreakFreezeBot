import { retrieveLaunchParams } from "@telegram-apps/sdk-react";


export const MakeUserRequestLocation = () => {
	const launchParams = retrieveLaunchParams();

    return window.location.origin + '/user/' + launchParams.initData?.user?.id
}