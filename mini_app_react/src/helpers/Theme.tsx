import WebApp from '@twa-dev/sdk'

const IsApple = () => {
	const apple = ["ios", "macos"]

	return apple.includes(WebApp.platform ?? 'none')
}

export const ForegroundColor = () => {
	return IsApple() ? 'var(--tg-theme-header-bg-color)' : 'var(--tg-theme-bg-color)'
}

export const BackgroundColor = () => {
	return 'var(--tg-theme-bg-color)'
}