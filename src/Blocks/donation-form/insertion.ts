import policy from '../../form-content-policy.json'
import type { Block, BlockType } from '@wordpress/blocks'

export const FORM_BLOCK = 'famehelsinki/donation-form'
export const FORBIDDEN_FORM_CONTENT = new Set(policy.forbiddenBlocks)

type ContextSelectors = {
	getBlock: (id: string) => Block | null
	getBlockParentsByBlockName: (id: string, name: string) => string[]
}

/** Runtime-only policy; no list of installed block types is saved into content. */
export function canInsertDonationContent(
	canInsert: boolean,
	blockType: Pick<BlockType, 'name'>,
	rootClientId?: string,
	selectors?: ContextSelectors
): boolean {
	if (!canInsert || !rootClientId || !selectors || !FORBIDDEN_FORM_CONTENT.has(blockType.name)) {
		return canInsert
	}
	const insideForm =
		selectors.getBlock(rootClientId)?.name === FORM_BLOCK ||
		selectors.getBlockParentsByBlockName(rootClientId, FORM_BLOCK).length > 0
	return !insideForm
}
