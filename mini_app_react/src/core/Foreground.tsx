import React, { CSSProperties } from "react"
import { ForegroundColor } from "../helpers/Theme"

export const Foreground: React.FC<React.PropsWithChildren> = ({ children }) => {
	const style: CSSProperties = {
		backgroundColor: ForegroundColor(),
		maxHeight: 'fit-content',
	}

	return (
		<div style={style}>
			{children}
		</div>
	)
}