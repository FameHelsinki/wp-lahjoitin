import { describe, it, expect, jest } from '@jest/globals'
import { render } from '@testing-library/react'
import save from './save'

jest.mock('@wordpress/block-editor', () => {
	const React = require('react')
	return {
		InnerBlocks: {
			Content: () => React.createElement('div', { 'data-testid': 'innerblocks-content' }),
		},
	}
})

describe('donation-form save()', () => {
	it('renders InnerBlocks.Content so child blocks are serialized', () => {
		const { getByTestId } = render(save() as any)
		expect(getByTestId('innerblocks-content')).toBeTruthy()
	})
})
