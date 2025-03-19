import React from 'react'
import { TextControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { AmountSetting, formatAmount } from '../common/donation-amount.ts'

type Props = {
	settings: AmountSetting
	onChange: (settings: AmountSetting) => void
}

const AmountControl: React.FC<Props> = ({ settings, onChange }) => {
	const amounts = settings.amounts
	if (!amounts) return null

	return (
		<div>
			{amounts.map((amount, idx) => (
				<TextControl
					key={idx}
					label={`${__('Amount', 'fame_lahjoitukset')} ${idx + 1}`}
					value={(amount.value ?? 0).toString()}
					onChange={value => {
						const newAmount = formatAmount(value, 0)
						const newAmounts = amounts.toSpliced(idx, 1, {
							value: newAmount,
						})

						onChange({
							...settings,
							defaultAmount:
								settings.defaultAmount === amount.value
									? newAmount
									: settings.defaultAmount,
							amounts: newAmounts,
						})
					}}
				/>
			))}
		</div>
	)
}

export default AmountControl
