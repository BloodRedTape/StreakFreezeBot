import { BaseHTMLAttributes, CSSProperties, ReactNode } from "react"

export interface EntryProps extends BaseHTMLAttributes<HTMLDivElement> {
	before?: ReactNode
    after?: ReactNode
    afterFloatLeft?: boolean
}

export const Entry: React.FC<React.PropsWithChildren<EntryProps>> = ({children, before, after, afterFloatLeft, style, ...restProps}) => {
    const commonChildStyle: CSSProperties = {
        display: 'inline-block',
        marginTop: 'auto',
        marginBottom: 'auto'
    };

    const floatRight: CSSProperties = {
        marginLeft: 'auto',
        marginRight: '0px'
	}

    return (
    <div style={{ ...style, background: 'var(--tg-theme-header-bg-color)'}} { ...restProps} >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <div style={commonChildStyle}>
                {before}
            </div>
            <div style={commonChildStyle}>
                {children}
            </div>
            <div style={afterFloatLeft ?? false ? { ...commonChildStyle } : { ...commonChildStyle, ...floatRight }}>
                {after}
            </div>
        </div>
    </div>
    )
}