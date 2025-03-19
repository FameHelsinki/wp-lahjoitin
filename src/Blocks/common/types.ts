export type SaveProps<T = any> = {
	attributes: T
	setAttributes: (attributes: T) => void
}

export type EditProps<T = any> = SaveProps<T> & {
	context: any
	clientId: string
}
