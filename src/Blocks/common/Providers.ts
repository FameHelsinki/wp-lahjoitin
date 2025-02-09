import {__} from "@wordpress/i18n";

export type Provider = {
	/** Provider machine name. */
	value: string
	/** Human-readable provider name. */
	label: string
	/** Supported types. */
	types: string[]
}

/**
 * Note: Typescript enums are cursed, use JS constants instead.
 */
export const PROVIDERS: Provider[] = [
	{
		value: 'mobilepay',
		label: __('MobilePay', 'fame_lahjoitukset'),
		types: ['single', 'recurring']
	},
	{
		value: 'checkout',
		label: __('Paytrail', 'fame_lahjoitukset'),
		types: ['single']
	},
	{
		value: 'finvoice',
		label: __('Finvoice', 'fame_lahjoitukset'),
		types: []
	},
	{
		value: 'paymenthighway',
		label: __('Payment Highway', 'fame_lahjoitukset'),
		types: []
	},
]
