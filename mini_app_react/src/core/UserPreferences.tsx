
export type PreferencePropertyType = {
	key: string,
	value: boolean
}

export const ParseUserPreferencesCategory = (data: any): PreferencePropertyType[] => {
    const result: PreferencePropertyType[] = [];

    for (const key in data) {
        if (!data.hasOwnProperty(key))
            continue;

		const value = data[key];

        if (typeof value === 'boolean') {
            result.push({ key, value });
        }
    }

    return result;
}

export const ParseUserPreferences = (data: any): Map<string, PreferencePropertyType[]> => {
    const userPreferencesMap = new Map<string, PreferencePropertyType[]>();

    for (const category in data) {
        if (data.hasOwnProperty(category)) {
            const userData = data[category];

            const preferences = ParseUserPreferencesCategory(userData);

            userPreferencesMap.set(category, preferences);
        }
    }

    return userPreferencesMap;
}

export const UserPreferencesToObject = (preferencesMap: Map<string, PreferencePropertyType[]>): Record<string, Record<string, boolean>> => {
    const result: Record<string, Record<string, boolean>> = {};

    preferencesMap.forEach((preferences, userId) => {
        const userPreferences: Record<string, boolean> = {};

        preferences.forEach(preference => {
            userPreferences[preference.key] = preference.value;
        });

        result[userId] = userPreferences;
    });

    return result;
}