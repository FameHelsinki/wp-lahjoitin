export function getErrorType(validity: ValidityState) {
	if (validity.valueMissing) {
		return 'required'
	}

	return 'unknown'
}

export type ErrorTranslations = {
	[key: string]: {
		[key in ReturnType<typeof getErrorType>]?: string
	} & {
		unknown: string
	}
}

export type ValidationResult = {
	[key: string]: any
}

export default class Validation extends Error {
	errors: ValidationResult

	constructor(message: string, errors: ValidationResult) {
		super(message)
		this.errors = errors
	}
}

