import { describe, expect, test } from '@jest/globals'
import { DEFAULT_AMOUNT, formatAmount, nextAmount, isVisible } from './donation-amount.ts'

describe('formatAmount', () => {
	test('returns number when given a number', () => {
		expect(formatAmount(42)).toBe(42)
	})

	test('parses a valid numeric string', () => {
		expect(formatAmount('42')).toBe(42)
	})

	test('returns default value when input is undefined', () => {
		expect(formatAmount(undefined, DEFAULT_AMOUNT)).toBe(DEFAULT_AMOUNT)
	})

	test('returns default value when input is an empty string', () => {
		expect(formatAmount('', DEFAULT_AMOUNT)).toBe(DEFAULT_AMOUNT)
	})

	test('returns default value when input is a non-numeric string', () => {
		expect(formatAmount('abc', DEFAULT_AMOUNT)).toBe(DEFAULT_AMOUNT)
	})

	test('returns the default value when input is NaN', () => {
		expect(formatAmount('NaN', DEFAULT_AMOUNT)).toBe(DEFAULT_AMOUNT)
	})
})

describe('nextAmount', () => {
	test('returns DEFAULT_AMOUNT when amounts is undefined', () => {
		expect(nextAmount(undefined)).toBe(DEFAULT_AMOUNT)
	})

	test('returns DEFAULT_AMOUNT when amounts is an empty array', () => {
		expect(nextAmount([])).toBe(DEFAULT_AMOUNT)
	})

	test('returns previous value + DEFAULT_AMOUNT', () => {
		expect(nextAmount([{ value: 50 }])).toBe(50 + DEFAULT_AMOUNT)
	})

	test('handles previous value as a string', () => {
		expect(nextAmount([{ value: '25' }])).toBe(25 + DEFAULT_AMOUNT)
	})

	test('handles previous value as undefined', () => {
		expect(nextAmount([{ value: undefined }])).toBe(DEFAULT_AMOUNT)
	})
})

describe('isVisible', () => {
	test('returns true when other is true', () => {
		expect(isVisible(true, [])).toBe(true)
	})

	test('returns false when other is false and settings is empty', () => {
		expect(isVisible(false, [])).toBe(false)
	})

	test('returns true when at least one setting has amounts', () => {
		expect(isVisible(false, [{ amounts: [{ value: 10 }] }])).toBe(true)
	})

	test('returns false when no setting has amounts', () => {
		expect(isVisible(false, [{ amounts: [] }, {}])).toBe(false)
	})
})
