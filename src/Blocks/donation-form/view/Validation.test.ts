import { describe, expect, it } from '@jest/globals'
import Validation, { getErrorType } from './Validation.ts'

describe('getErrorType', () => {
	it('maps missing values to required', () => {
		expect(getErrorType({ valueMissing: true } as ValidityState)).toBe('required')
	})

	it('maps everything else to unknown', () => {
		expect(getErrorType({ valueMissing: false, typeMismatch: true } as ValidityState)).toBe(
			'unknown'
		)
	})
})

describe('Validation', () => {
	it('is an Error carrying per-field messages', () => {
		const error = new Validation('invalid', { email: 'Email is required' })

		expect(error).toBeInstanceOf(Error)
		expect(error.message).toBe('invalid')
		expect(error.errors).toEqual({ email: 'Email is required' })
	})
})
