import { Listbox, ListboxItem } from "@nextui-org/react"
import { Text, Switch } from "@telegram-apps/telegram-ui"
import { useEffect, useState } from "react"
import { Loader } from "../core/Loader"
import { FetchUserContext, useGetUserContext, useSetUserContext } from "../core/UserContext"
import { PreferencePropertyType } from "../core/UserPreferences"
import { ErrorPopupFromJson, JsonFromResp, SetPreferences } from "../helpers/Requests"

type OnChanged = ()=>void

const PreferencePropertySwitch: React.FC<{ property: PreferencePropertyType, onChanged: OnChanged }> = ({property, onChanged}) => {
    const [checked, setChecked] = useState(property.value)

    useEffect(() => {
        property.value = checked
        onChanged()
    }, [checked])

    return (
        <div style={{
        	display: 'flex',
	        alignItems: 'center',
            justifyContent: 'center',
            height: '10px' 
        }}>
            {
                checked
                    ? <Switch checked onChange={e => setChecked(e.target.checked)} />
                    : <Switch onChange={e => setChecked(e.target.checked)} />
            }
        </div>
    )
}

const Names = new Map<string, string>([
	['DayAlmostOver', '2 hours prior to streak loss'],
	['CanNotWait',' 15 mins prior to streak loss'],
	['StreakLost','after streak loss'],
	['ChallengeLost', 'after challenge loss'],
	['Commited','after commit'],
	['Freezed','after freeze usage'],
])

const MakePreferenceProperty = (property: PreferencePropertyType, onChanged: OnChanged ) => {
    return (
        <ListboxItem
            key={property.key}
            endContent={<PreferencePropertySwitch property={property} onChanged={onChanged}/>}
        >
            <Text weight="3">{Names.get(property.key) ?? property.key}</Text>
        </ListboxItem>
    )
}

const PreferencesCategory: React.FC<{ category: string, preferences: PreferencePropertyType[], onChanged: OnChanged }> = ({category, preferences, onChanged }) => {
    return (
        <div>
            <Text weight="2">{category}</Text>
 		    <Listbox 
 			    items={preferences}
 			    className="bg-content2 rounded-small"
 			    emptyContent={<div />}
 			    itemClasses={{ base: "h-9" }}
 			    shouldHighlightOnFocus={false}
 		    >
                {(entry) => MakePreferenceProperty(entry, onChanged)}
		    </Listbox>
        </div>
    )
}

function mapToArray<K, V>(map: Map<K, V>): [K, V][] {
    const array: [K, V][] = [];
    
    // Using forEach to iterate over the Map entries
    map.forEach((value, key) => {
        array.push([key, value]);
    });

    return array;
}

export const Preferences = () => {
    const userContext = useGetUserContext();
    const setUserContext = useSetUserContext();

    if (!userContext)
        return <Loader text="Loading..." />

    const Refresh = () => {
		FetchUserContext().then(setUserContext)
	}

    const onChanged = () => {
        SetPreferences(userContext.Preferences).then(JsonFromResp).then(ErrorPopupFromJson).then((error) => {
            if (error) {
                Refresh()
            }
		})
	}

    return (
        <div style={{ padding: '5%' }}>
            <div>
                {mapToArray(userContext.Preferences).map(([category, preferences]) => <PreferencesCategory category={category} preferences={preferences} onChanged={onChanged }/>) }
            </div>
            <div className="bg-content2 rounded-small">
            </div>
        </div>
    );
}


