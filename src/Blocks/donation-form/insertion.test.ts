import { describe, test, expect } from '@jest/globals'
import { canInsertDonationContent, FORBIDDEN_FORM_CONTENT } from './insertion'

describe('donation form insertion policy', () => {
	const selectors = {
		getBlock: () => null,
		getBlockParentsByBlockName: () => ['parent-form'],
	}
	for (const name of FORBIDDEN_FORM_CONTENT) {
		test(`rejects ${name} at any depth in a donation form`, () => {
			expect(canInsertDonationContent(true, { name }, 'nested-group', selectors)).toBe(false)
			expect(
				canInsertDonationContent(true, { name }, 'outside', {
					...selectors,
					getBlockParentsByBlockName: () => [],
				})
			).toBe(true)
		})
	}
	test('keeps paragraphs, styled groups and extension fields available', () => {
		for (const name of ['core/paragraph', 'core/group', 'custom/newsletter']) {
			expect(canInsertDonationContent(true, { name }, 'column', selectors)).toBe(true)
		}
		expect(
			canInsertDonationContent(false, { name: 'core/paragraph' }, 'column', selectors)
		).toBe(false)
	})
})
