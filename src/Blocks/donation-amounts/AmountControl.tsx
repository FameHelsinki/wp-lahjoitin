import React from 'react'
import { Button, Flex, TextControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { Amount, DEFAULT_AMOUNT, formatAmount } from '../common/donation-amount.ts'

type Props = {
	type: string
	amounts: Amount[]
	onChange: (amounts: Amount[]) => void
}

/**
 * Get default value for new amount.
 */
function nextAmount(amounts: Amount[]): number {
	const previous = amounts.at(-1)?.amount
	return previous ? previous + DEFAULT_AMOUNT : DEFAULT_AMOUNT
}

const AmountControl: React.FC<Props> = ({ amounts, type, onChange }) => {
	if (!amounts) return null

	return (
		<div>
			{amounts.map(({ amount }, idx) => (
				<Flex key={idx}>
					<TextControl
						label={`${__('Amount', 'fame_lahjoitukset')} ${idx + 1}`}
						value={(amount ?? 0).toString()}
						onChange={value =>
							onChange(
								amounts.toSpliced(idx, 1, {
									amount: formatAmount(value, 0),
									type,
								})
							)
						}
					/>
					<Button variant="secondary" onClick={() => onChange(amounts.toSpliced(idx, 1))}>
						{__('Remove', 'fame_lahjoitukset')}
					</Button>
				</Flex>
			))}
			<Button
				variant="primary"
				onClick={() =>
					onChange(
						amounts.toSpliced(amounts.length, 0, {
							amount: nextAmount(amounts),
							type,
						})
					)
				}
			>
				{__('Add', 'fame_lahjoitukset')}
			</Button>
		</div>
	)
}

export default AmountControl
