import { FC } from 'react'

export type Control<T = {}, P = {}> = FC<T> & { Content: FC<P> }

export type SaveProps<T = any> = {
	attributes: T
	setAttributes: (attributes: T) => void
}

export type EditProps<T = any> = SaveProps<T> & {
	context: any
	clientId: string
}
