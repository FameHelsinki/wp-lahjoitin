import React from 'react'
import { Button, Flex, TextControl } from '@wordpress/components'
import { formatAmount } from '../common/utils.ts'
import { __ } from '@wordpress/i18n'

export type Amount = {
	amount: number
}

type Props = {
	amounts: Amount[]
	onChange: (amounts: Amount[]) => void
}

const AmountControl: React.FC<Props> = ({ amounts, onChange }) => (
	<div>
		{amounts.map(({ amount }, idx) => (
			<Flex key={idx}>
				<TextControl
					label={`${__('Amount', 'fame_lahjoitukset')} ${idx + 1}`}
					value={amount}
					onChange={(value) =>
						onChange(
							amounts.map((prevAmount, prevIdx) =>
								prevIdx === idx
									? { amount: formatAmount(value, 0) }
									: prevAmount
							)
						)
					}
				/>
				<Button
					variant="secondary"
					onClick={() => onChange(amounts.toSpliced(idx, 1))}
				>
					{__('Remove', 'fame_lahjoitukset')}
				</Button>
			</Flex>
		))}
		<Button
			variant="primary"
			onClick={() =>
				onChange([
					...amounts,
					{
						amount:
							parseInt(
								(amounts?.at(-1)?.amount ?? 0).toString()
							) + 10,
					},
				])
			}
		>
			{__('Add', 'fame_lahjoitukset')}
		</Button>
	</div>
)

export default AmountControl
