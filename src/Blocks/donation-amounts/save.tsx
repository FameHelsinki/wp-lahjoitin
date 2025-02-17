import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'
import { DEFAULT_AMOUNT, DEFAULT_LEGEND, derivedAmounts } from '../common/donation-amount.ts'
import { DONATION_TYPES } from '../common/donation-type.ts'
import { Attributes } from './edit.tsx'
import { __ } from '@wordpress/i18n'

type SaveAttributes = Attributes & {
	type?: boolean
}

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 */
export default function save({ attributes }: SaveProps<SaveAttributes>): React.JSX.Element {
	const { type: defaultType, other, otherLabel, showLegend, legend } = attributes

	const derived = derivedAmounts(
		DONATION_TYPES.map(({ value }) => value),
		attributes
	)

	// Visible if other amount is shown or amount buttons is not empty.
	const visible = other || derived.some(type => type.amounts.length)

	if (!visible) {
		return <></>
	}

	console.log('save', derived, attributes, defaultType)

	return (
		<fieldset
			{...useBlockProps.save({ className: 'donation-amounts' })}
			data-default={defaultType}
		>
			<RichText.Content
				tagName="legend"
				className={'donation-amounts__legend' + (showLegend ? '' : ' screen-reader-text')}
				value={legend || DEFAULT_LEGEND}
			/>

			{derived.map(type => (
				<div
					className="donation-amounts__controls"
					key={type.type}
					data-type={type.type}
					style={{ display: type.type === defaultType ? 'initial' : 'none' }}
				>
					{type.amounts.map(({ amount }, idx) => (
						<div className="donation-amounts__amount" key={amount}>
							<input
								id={`${type.type}-amount-${idx}`}
								checked={amount === type.amount}
								name={`amount-radio-${type.type}`}
								value={amount}
								type="radio"
							/>
							<label htmlFor={`${type.type}-amount-${idx}`} key={idx}>
								{amount} <span className="donation-amounts__unit">{type.unit}</span>
							</label>
						</div>
					))}
					{other && (
						<div className="donation-amounts__other">
							<RichText.Content
								htmlFor={`${type.type}-other`}
								tagName="label"
								value={otherLabel || __('Other amount', 'fame_lahjoitukset')}
							/>
							<input
								id={`${type.type}-other`}
								name={`amount-${type.type}`}
								type="number"
								aria-describedby={`${type.type}-other-unit`}
							/>
							<span id={`${type.type}-other-unit`} className="donation-amounts__unit">
								{type.unit}
							</span>
						</div>
					)}
				</div>
			))}

			{/*
				The server only cares about `name` field. This hidden
				input field must be kept up to date with radio buttons
				and free amount field with javascript.
			*/}
			<input
				name="amount"
				type="hidden"
				value={derived.find(({ type }) => type === defaultType)?.amount || DEFAULT_AMOUNT}
			/>
		</fieldset>
	)
}
