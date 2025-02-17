import { __ } from '@wordpress/i18n'

export const DEFAULT_AMOUNT = 10
export const DEFAULT_UNIT = '€'
export const DEFAULT_LEGEND = __('Donation amount', 'fame_lahjoitukset')

export type Amount = {
	type?: string
	amount?: number
}

export type AmountSetting = Amount & {
	unit?: string
}

export const formatAmount = (amount: string, def = DEFAULT_AMOUNT) => parseInt(amount, 10) || def

export type DerivedAmount = Required<AmountSetting> & { amounts: Amount[] }

/**
 * Convert block attributes to nicer format.
 */
export function derivedAmounts(
	types: string[],
	attributes: { amounts?: Amount[]; settings?: AmountSetting[] }
): DerivedAmount[] {
	const { amounts, settings } = attributes

	return types?.reduce((derived, type: string) => {
		derived.push({
			amount: DEFAULT_AMOUNT,
			unit: DEFAULT_UNIT,
			...settings?.find(setting => setting.type === type),
			amounts: amounts?.filter(amount => amount.type === type) ?? [
				{
					type,
					amount: DEFAULT_AMOUNT,
				},
			],
			type,
		})

		return derived
	}, [] as DerivedAmount[])
}

export function spliceSettings(settings: AmountSetting[] | undefined, value: AmountSetting) {
	return (
		(settings ?? [])
			// Filter out currently edited setting.
			.filter(setting => setting.type !== value.type)
			// Add new settings at the end.
			.toSpliced(-1, 0, value)
	)
}
