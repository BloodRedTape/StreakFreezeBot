import { Button, Input, List, Modal, Section, Slider, Text } from "@telegram-apps/telegram-ui"
import { CSSProperties, useState } from "react"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { JsonFromResp, PopupFromJson, PostAddFreeze } from "../helpers/Requests"
import { ForegroundColor } from "../helpers/Theme"

const FreezeInput = () => {
	const setUserContext = useSetUserContext()

	const [reason, setReason] = useState<string>("For no reason")
	const [durationIndex, setDurationIndex] = useState<number>(2)
	const durations = [1, 2, 5, 7, 14, 31];
	const currentDuration = durations[durationIndex - 1]

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnAddFreeze = () => {
		PostAddFreeze(currentDuration, reason).then(JsonFromResp).then(PopupFromJson).then(Refresh);
	}

	return (
		<List>
			<Text
				style={{ margin: '20px', left: '50%', display: 'flex'}}
				weight="2"
			>
				Enter freeze details!
			</Text>

			<Input
				header="Reason"
				placeholder="For being strong a few days long."
				value={reason}
				onChange={e => setReason(e.target.value)}
			/>


			<Section header={"Expire in " + currentDuration + " days"}>
				<Slider
					step={1}
					min={1}
					max={durations.length}
					value={durationIndex}
					onChange={ e=>setDurationIndex(e) }
				/>

				<Modal.Close>
					<Button
						onClick={OnAddFreeze}
						style={{ margin: '5%', width: '90%' }}
					>
						Add
					</Button>
				</Modal.Close>
			</Section>
			<br/>
			<br/>
			<br/>
		</List>
	)
}

export const AddFreezeModal = () => { 
	const userContext = useGetUserContext()

	const ReachedMaxFreezes = !userContext?.CanAddFreeze() ?? false

	const buttonStyle: CSSProperties = {
		margin: '10px',
		display: 'inline-flex',
	}

	return (
		<Modal
			header={<Modal.Header />}
			style={{background: ForegroundColor()} }
			trigger={
				<Button
					style={buttonStyle}
					disabled={ReachedMaxFreezes}
					size="s"
					mode="bezeled"
				>
					New Freeze
				</Button>
			}
		>
			<FreezeInput/>
		</Modal>
	)
}
