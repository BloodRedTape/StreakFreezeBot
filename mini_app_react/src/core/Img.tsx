import { CSSProperties } from "react"

export const Img: React.FC<{ src: string, style?: CSSProperties}> = ({src, style})=>{
    return (
        src ? <img src={src} style={style} /> : <div style={style}/>
    )
}