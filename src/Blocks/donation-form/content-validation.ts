import type { Block } from '@wordpress/blocks'
import { FORBIDDEN_FORM_CONTENT } from './insertion'

/** Immediate checks also apply to patterns, pasted groups and code-editor changes. */
export function invalidContent(blocks: Block[]): string[] {
	const invalid = new Set<string>()
	const visit = (items: Block[]) =>
		items.forEach(block => {
			if (FORBIDDEN_FORM_CONTENT.has(block.name)) invalid.add(block.name)
			if (['core/html', 'core/freeform'].includes(block.name)) {
				// Newer versions of WordPress store Custom HTML in markup fragments.
				const html =
					block.innerContent?.join('') ??
					String(block.attributes.content ?? block.attributes.text ?? '')
				if (new DOMParser().parseFromString(html, 'text/html').querySelector('form')) {
					invalid.add(block.name)
				}
			}
			visit(block.innerBlocks)
		})
	visit(blocks)
	return [...invalid]
}
