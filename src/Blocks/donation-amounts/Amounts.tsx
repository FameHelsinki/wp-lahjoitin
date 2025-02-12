import React from 'react'

import { RichText } from '@wordpress/block-editor'
import { Amount } from './AmountControl.tsx'

type Props = {
	amounts: Amount[]
	otherAmount: boolean | string
	otherAmountLabel: string
	unit: string
}

const Amounts: React.FC<Props> = ({
	amounts,
	otherAmount,
	otherAmountLabel,
	unit,
}) => (
	<>
		{amounts.map(({ amount }, idx) => (
			<div className="donation-amounts__amount" key={idx}>
				<label htmlFor={`amount-${idx}-${amount}`} key={idx}>
					{amount} {unit}
					<input
						id={`amount-${idx}-${amount}`}
						name="amount-radio"
						value={amount}
						type="radio"
					/>
				</label>
			</div>
		))}
		{(otherAmount === true || otherAmount === 'true') && (
			<div className="donation-amounts__other">
				<label htmlFor="amount-other">
					<RichText.Content tagName="span" value={otherAmountLabel} />
					<input id="amount-other" name="amount" type="number" />
				</label>
				{unit}
			</div>
		)}
	</>
)

export default Amounts
