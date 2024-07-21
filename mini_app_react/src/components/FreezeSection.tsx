import { Button, Input, List, Modal, Section, Slider, Text } from "@xelene/tgui";
import { CSSProperties, useState } from "react";
import { Background } from "../core/Background";
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext";
import { JsonFromResp, PopupFromJson, PostAddFreeze } from "../helpers/Requests";
import { Freeze } from "./Freeze";



const FreezeInput = () => {
	const setUserContext = useSetUserContext()

	const [reason, setReason] = useState<string>("For no reason")
	const [duration, setDuration] = useState<number>(4)

	const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

	const OnAddFreeze = () => {
		PostAddFreeze(duration, reason).then(JsonFromResp).then(PopupFromJson).then(Refresh);
	}

	return (
		<List>
			<Input
				header="Reason"
				placeholder="For being strong a few days long."
				value={reason}
				onChange={e => setReason(e.target.value)}
			/>


			<Section header={"Expire in " + duration + " days"}>
				<Slider
					step={1}
					min={1}
					max={7}
					value={duration}
					onChange={ e=>setDuration(e) }
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
		</List>
	)
}

const AddFreezeModal = () => { 
	const userContext = useGetUserContext()

	const ReachedMaxFreezes = !userContext?.CanAddFreeze() ?? false

	const buttonStyle: CSSProperties = {
		margin: '10px',
		display: 'inline-flex',
	}

	return (
		<Modal
			header={<Modal.Header />}
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
			<Background>
				<FreezeInput/>
			</Background>
		</Modal>
	)
}


export const FreezeSection = () => {


	const userContext = useGetUserContext()

	const FreezesList = (
		<List>
			{userContext?.AvailableFreezes.map((freeze) =>
				<Freeze freeze={userContext?.Freezes[freeze]} id={freeze} />)
			}
		</List>
	)

	return (
		<List>
			<div style={{margin: '10px'}}>
				<Text weight="2">Freezes</Text>
				<br/>
				<Text weight="3" style={{margin: '0px 10px'} }>Equipped { userContext?.AvailableFreezes.length ?? 0 }/{ userContext?.MaxFreezes ?? 0}</Text>
				<AddFreezeModal/>
			</div>
			<br />
			{FreezesList}
		</List>
	)
}