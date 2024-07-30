import { BaseHTMLAttributes, CSSProperties, ReactNode } from "react"

export interface EntryProps extends BaseHTMLAttributes<HTMLDivElement> {
	before?: ReactNode
	after?: ReactNode
}

export const Entry: React.FC<React.PropsWithChildren<EntryProps>> = ({children, before, after, style, ...restProps}) => {
    const commonChildStyle: CSSProperties = {
        display: 'inline-block',
        marginTop: 'auto',
        marginBottom: 'auto'
    };

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
            <div style={{ ...commonChildStyle, marginLeft: 'auto', marginRight: '0px' }}>
                {after}
            </div>
        </div>
    </div>
    )
}