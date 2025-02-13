import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 */
export default function save({ attributes }: SaveProps): React.JSX.Element {
	const { type, amounts, idx, amount, unit, other, otherLabel } = attributes

	return (
		<fieldset {...useBlockProps.save({ className: 'donation-amounts' })}>
			<legend className="donation-amounts__legend">Donation amount</legend>
			<div className="donation-amounts__controls">
				<div className="donation-amounts__amount" key={idx}>
					<input
						id={`amount-${idx}-${amount}`}
						name="amount-radio"
						value={amount}
						type="radio"
					/>
					<label htmlFor={`amount-${idx}-${amount}`} key={idx}>
						{amount} {unit}
					</label>
				</div>

				{other && (
					<div className="donation-amounts__other">
						<RichText.Content
							htmlFor="amount-other"
							tagName="label"
							value={otherLabel}
						/>
						<input id="amount-other" name="amount" type="number" />
						{unit}
					</div>
				)}
			</div>
		</fieldset>
	)
}
