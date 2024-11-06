import { BaseHTMLAttributes, CSSProperties, ReactNode } from "react"
import { ForegroundColor } from "../helpers/Theme"

export interface EntryProps extends BaseHTMLAttributes<HTMLDivElement> {
	before?: ReactNode
    after?: ReactNode
    afterFloatLeft?: boolean
    childrenBoxStyle?: CSSProperties
    onContentClick?: ()=>void
}

export const Entry: React.FC<React.PropsWithChildren<EntryProps>> = ({children, before, after, afterFloatLeft, style, childrenBoxStyle, onContentClick, ...restProps}) => {
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
    <div style={{ ...style, background: ForegroundColor()}} { ...restProps} >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <div style={commonChildStyle}>
                {before}
            </div>
            <div onClick={ onContentClick} style={{flex: '1', overflow: 'hidden', ...commonChildStyle, ...childrenBoxStyle}}>
                {children}
            </div>
            <div style={afterFloatLeft ?? false ? { ...commonChildStyle } : { ...commonChildStyle, ...floatRight }}>
                {after}
            </div>
        </div>
    </div>
    )
}