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
	return useSelect(
		select => {
			const be = select('core/block-editor') as any
			const { getBlock, getBlockRootClientId, getClientIdsOfDescendants } = be

			// Find the nearest "famehelsinki/donation-form" container (or the parent).
			let containerId: string | null = clientId
			let lastId: string | null = clientId

			while (containerId) {
				const parentId = getBlockRootClientId(containerId)
				if (!parentId) break

				const parentBlock = getBlock(parentId)
				lastId = parentId
				containerId = parentId

				if (parentBlock?.name === 'famehelsinki/donation-form') {
					break
				}
			}

			const rootId = containerId || lastId
			if (!rootId) return null

			// Find all descendants (also within groups) and search for donation-type.
			const descendantIds: string[] = getClientIdsOfDescendants([rootId]) || []
			const allIds = [rootId, ...descendantIds]

			const typeBlock =
				allIds
					.map(id => getBlock(id))
					.find((b: any) => b?.name === 'famehelsinki/donation-type') || null

			return typeBlock?.attributes?.value ?? null
		},
		[clientId]
	)
}
