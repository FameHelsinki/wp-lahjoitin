import React from 'react'
import { Button, Flex, TextControl } from '@wordpress/components'
import { formatAmount } from '../common/utils.ts'

export type Amount = {
	amount: number
}

type Props = {
	amounts: Amount[]
	amountLabel: string
	removeLabel: string
	addLabel: string
	onChange: (amounts: Amount[]) => void
}

const AmountControl: React.FC<Props> = ({
	amounts,
	amountLabel,
	removeLabel,
	addLabel,
	onChange,
}) => (
	<div>
		{amounts.map(({ amount }, idx) => (
			<Flex key={idx}>
				<TextControl
					label={amountLabel}
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
					{removeLabel}
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
			{addLabel}
		</Button>
	</div>
)

export default AmountControl
