import { Modal, Text, Button } from "@xelene/tgui"
import { Img } from "../core/Img"
import { GetExtendedStreakBorderColor, GetExtendedStreakFire } from "../helpers/Resources"
import { ForegroundColor } from "../helpers/Theme"


type ExtendedStreakProps = {
	count: number
	comment: string
	onExtendedFinish: ()=>void
}

export const ExtendedStreak: React.FC<ExtendedStreakProps> = ({ count, comment, onExtendedFinish }) => {

	const outline = '1px'
	const outlineColor = GetExtendedStreakBorderColor()

	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			padding: '5%',
		}}>
			<div>
				<Img
					style={{width: 'auto', height: '40vw'}}
					src={GetExtendedStreakFire()}
				/>
			</div>

			<text style={{
					display: 'block',
					fontSize: 90,
					fontWeight: 'bold',
					fontFamily: 'arial',
					color: outlineColor,
					WebkitTextStroke: outline,
					WebkitTextStrokeColor: outlineColor
			}}>
				{count}
			</text>


			<text style={{
				color: outlineColor,
				fontSize: 24,
				fontWeight: 'bold',
				fontFamily: 'arial'
			}}>
				Day{count > 1 ? 's' : ''} streak!
			</text>
			<Text weight="2" style={{ paddingTop: '10px', textAlign: 'center'}}>{comment}</Text>
			<Button
				stretched
				onClick={onExtendedFinish}
				style={{ marginTop: '10vh', marginBottom: '5%' }}
			>
				Continue
			</Button>
		</div>
	)
}

type ExtendedStreakModalProps = ExtendedStreakProps & {
	extended: boolean
}

export const ExtendedStreakModal: React.FC<ExtendedStreakModalProps> = ({ extended, onExtendedFinish, ...other }) => {

	return (
		<Modal
			open={extended}
			style={{ background: ForegroundColor() }}
		>
			<ExtendedStreak onExtendedFinish={onExtendedFinish} {...other}/>
		</Modal>
	)
}