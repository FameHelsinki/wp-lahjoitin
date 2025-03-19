import { __ } from '@wordpress/i18n'
import { useSelect } from '@wordpress/data'

export type DonationType = {
	value: string
	label: string
}

const TYPES = {
	single: __('Single', 'fame_lahjoitukset'),
	recurring: __('Recurring', 'fame_lahjoitukset'),
}

export const DONATION_TYPES: DonationType[] = Object.entries(TYPES).map(([value, label]) => ({
	value,
	label,
}))

export const DEFAULT_DONATION_TYPE = DONATION_TYPES[0]

/**
 * Get donation label from type value.
 *
 * @param type Donation type.
 */
export function getDonationLabel(type: string): string | undefined {
	return TYPES[type] ?? `Unknown type ${type}`
}

/**
 * Extracts current donation type with gutenberg magic.
 */
export function useCurrentDonationType(clientId: string): string | null {
	// Get the parent block and its inner blocks
	const typeBlock = useSelect(
		select => {
			const { getBlockRootClientId, getBlocks } = select('core/block-editor') as any
			const parentClientId = getBlockRootClientId(clientId)

			if (!parentClientId) {
				return null
			}

			// Find the first sibling block that is a core/paragraph
			return (
				getBlocks(parentClientId).find(
					(block: any) => block.name === 'famehelsinki/donation-type'
				) || null
			)
		},
		[clientId]
	)

	if (typeBlock) {
		return typeBlock.attributes.value
	}

	return null
}
