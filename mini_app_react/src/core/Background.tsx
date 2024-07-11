import React, { CSSProperties } from "react"

export const Background: React.FC<React.PropsWithChildren> = ({ children }) => {
	const style: CSSProperties = {
		backgroundColor: 'var(--tg-theme-bg-color)',
		maxHeight: 'fit-content'
	}

	return (
		<div style={style}>
			{children}
		</div>
	)
}