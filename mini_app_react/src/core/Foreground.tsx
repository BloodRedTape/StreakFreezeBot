import React, { CSSProperties } from "react"

export const Foreground: React.FC<React.PropsWithChildren> = ({ children }) => {
	const style: CSSProperties = {
		backgroundColor: 'var(--tg-theme-header-bg-color)',
		maxHeight: 'fit-content',
	}

	return (
		<div style={style}>
			{children}
		</div>
	)
}