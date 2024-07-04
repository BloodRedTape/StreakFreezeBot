import { Banner, List, Text, Breadcrumbs, Divider, Blockquote} from '@xelene/tgui';
import { BreadCrumbsItem } from '@xelene/tgui/dist/components/Navigation/Breadcrumbs/components/BreadCrumbsItem/BreadCrumbsItem';
import { Calendar } from './Calendar';

export const StreakSection = () => {
	let streak = 2345;
	let quote = 'There is nothing better than extending your streak!'
	let month = 'July'

	let stats = Object.entries({
		'Commited': 13,
		'Freezed': 2
	})

	return (
		<Banner header="Streak">
			<List>
				<Text weight="3">{ streak } days</Text>
				<br />
				<br />
				<Blockquote type="text"> { quote } </Blockquote>
				<Divider />
				<Text weight="2">{ month }</Text>
				<br />
				<br />
				<Breadcrumbs>
					{
						stats.map((pair) => 
							(<BreadCrumbsItem>
								<List>
									<Text weight="2">{pair[0]}</Text>
									<br />
									<Text weight="3">{pair[1]} Days</Text>
								</List>
							</BreadCrumbsItem>)
						)
					}
				</Breadcrumbs>
				<Calendar/>
			</List>
		</Banner>
	);
}
