import { __ } from '@wordpress/i18n'

export type DonationType = {
	value: string
	label: string
}

const TYPES = {
	single: __('Single', 'fame_lahjoitukset'),
	recurring: __('Recurring', 'fame_lahjoitukset'),
}

export const DONATION_TYPES: DonationType[] = Object.entries(TYPES).map(
	([value, label]) => ({
		value,
		label,
	})
)

export const DEFAULT_DONATION_TYPE = DONATION_TYPES[0]

/**
 * Get donation label from type value.
 *
 * @param type
 *   Donation type.
 *
 * @returns
 *   Donation type label.
 */
export function getDonationLabel(type: string): string | undefined {
	return TYPES[type]
}
