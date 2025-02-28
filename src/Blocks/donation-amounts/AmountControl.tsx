import React from 'react'
import { TextControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { Amount, AmountSetting, formatAmount } from '../common/donation-amount.ts'

type Props = {
	type: string
	amounts: Amount[]
	settings: AmountSetting
	onChange: (amounts: Amount[], settings: AmountSetting) => void
}

const AmountControl: React.FC<Props> = ({ amounts, settings, type, onChange }) => {
	if (!amounts) return null

	return (
		<div>
			{amounts.map(({ amount }, idx) => (
				<TextControl
					key={idx}
					label={`${__('Amount', 'fame_lahjoitukset')} ${idx + 1}`}
					value={(amount ?? 0).toString()}
					onChange={value => {
						const newAmount = formatAmount(value, 0)
						const newAmounts = amounts.toSpliced(idx, 1, {
							amount: newAmount,
							type,
						})

						onChange(
							newAmounts,
							settings.amount === amount
								? {
										...settings,
										type,
										amount: newAmount,
									}
								: settings
						)
					}}
				/>
			))}
		</div>
	)
}

export default AmountControl
