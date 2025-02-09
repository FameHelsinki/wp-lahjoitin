import { __ } from '@wordpress/i18n'

export type DonationType = {
	value: string
	label: string
}

/**
 * Note: Typescript enums are cursed, use JS constants instead.
 */
export const DONATION_TYPES: DonationType[] = [
	{
		value: 'single',
		label: __('Single', 'fame_lahjoitukset'),
	},
	{
		value: 'recurring',
		label: __('Recurring', 'fame_lahjoitukset'),
	},
]

export const DEFAULT_DONATION_TYPE = DONATION_TYPES[0]
