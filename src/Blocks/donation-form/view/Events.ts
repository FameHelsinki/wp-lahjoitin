import { ValidationResult } from './Validation.ts'
import FormHandler from './FormHandler.ts'
import type { CustomData } from './CustomData.ts'

export type DonationRequestData = Record<string, FormDataEntryValue | CustomData> & {
	custom_data?: CustomData
}

export type FormSubmitEvent = CustomEvent<{
	url: URL
	data: DonationRequestData
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
