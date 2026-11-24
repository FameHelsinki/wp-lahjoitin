import { describe, test, expect } from '@jest/globals'
import type { Block } from '@wordpress/blocks'
import { invalidContent } from './content-validation'

const block = (name: string, content = '', innerBlocks: Block[] = []): Block => ({
	clientId: name,
	name,
	isValid: true,
	attributes: { content },
	innerBlocks,
})

describe('existing invalid content', () => {
	test('detects native forms in custom HTML and forbidden blocks inside pasted groups', () => {
		expect(invalidContent([block('core/html', '<form><input></form>')])).toEqual(['core/html'])
		expect(invalidContent([block('core/group', '', [block('core/search')])])).toEqual([
			'core/search',
		])
	})

	test('detects forms stored as Custom HTML markup fragments', () => {
		const html = block('core/html', '', [block('core/paragraph')])
		html.innerContent = ['<form>', null, '</form>']
		expect(invalidContent([html])).toEqual(['core/html'])
	})

	test('allows ordinary HTML and ignores form-like text in comments', () => {
		expect(
			invalidContent([
				block('core/html', '<button type="button">Info</button><!-- <form> -->'),
			])
		).toEqual([])
	})
})
