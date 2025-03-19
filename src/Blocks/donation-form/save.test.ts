import { describe, it, expect } from '@jest/globals'
import { render } from '@testing-library/react'
import save from './save'

// Mock attributes for testing
const mockAttributes = {
	returnAddress: 'https://example.com/return',
	campaign: 'test-campaign',
	token: true,
}

describe('Gutenberg Block Save Function', () => {
	it('renders correctly and matches snapshot', () => {
		const { container } = render(save({ attributes: mockAttributes }))
		expect(container).toMatchSnapshot()
	})
})
