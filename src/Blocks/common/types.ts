export type SaveProps<T = any> = {
	attributes: T
}

export type EditProps<T = any> = SaveProps<T> & {
	context: any
	clientId: string
	setAttributes: (attributes: T) => void
}
