import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'
import { DEFAULT_AMOUNT, DEFAULT_LEGEND } from '../common/donation-amount.ts'
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
	const { settings, other, otherLabel, showLegend, legend } = attributes

	console.log('save', settings)

	// Visible if other amount is shown or amount buttons is not empty.
	const visible = other || settings?.some(type => type?.amounts?.length)

	if (!visible) {
		return <></>
	}

	return (
		<fieldset {...useBlockProps.save({ className: 'donation-amounts' })}>
			<RichText.Content
				tagName="legend"
				className={'donation-amounts__legend' + (showLegend ? '' : ' screen-reader-text')}
				value={legend || DEFAULT_LEGEND}
			/>

			{settings?.map(type => (
				<div
					key={type.type}
					className={`donation-amounts__controls donation-amounts--${type.type}`}
					data-type={type.type}
					data-default={type.defaultAmount}
					style={{ display: type.default ? undefined : 'none' }}
				>
					{type.amounts?.map(({ value }, idx) => (
						<div className="donation-amounts__amount" key={value}>
							<input
								data-type={type.type}
								id={`${type.type}-amount-${idx}`}
								checked={value?.toString() === type.defaultAmount?.toString()}
								name={`amount-radio-${type.type}`}
								value={value}
								type="radio"
							/>
							<label htmlFor={`${type.type}-amount-${idx}`} key={idx}>
								{value} <span className="donation-amounts__unit">{type.unit}</span>
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
				value={settings?.find(type => type.default)?.defaultAmount || DEFAULT_AMOUNT}
			/>
		</fieldset>
	)
}
