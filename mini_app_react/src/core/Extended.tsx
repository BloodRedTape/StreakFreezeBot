
export enum ExtendedContentType {
	Unknown,
	Challenges,
	Active
}

const ParseExtendedContentType = (data: any): ExtendedContentType => {
	if (data === "Challenges")
		return ExtendedContentType.Challenges
	if (data === "Active")
		return ExtendedContentType.Active

	return ExtendedContentType.Unknown
}

export class ExtendedType {
	public Comment: string = ""
	public Show: Array<ExtendedContentType> = []
}

export const ParseExtendedType = (data: any): ExtendedType | undefined => {
	const result = new ExtendedType()
	result.Comment = data.Comment ?? ""
	result.Show = (data.Show ?? []).map(ParseExtendedContentType)

	if (!result.Comment.length || !result.Show.length)
		return undefined
	return result
}