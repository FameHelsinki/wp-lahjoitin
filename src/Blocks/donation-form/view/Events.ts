import { ValidationResult } from './Validation.ts'
import FormHandler from './FormHandler.ts'

export type FormSubmitEvent = CustomEvent<{
	url: URL,
	data: { [key: string]: FormDataEntryValue }
	handler: FormHandler
	errors: ValidationResult
}>

export type FormResult = {
	data: any
	provider: string
	redirect_url: string
	session: string
	type: string
}

export type FormResultEvent = CustomEvent<{
	result: FormResult
	handler: FormHandler
}>

