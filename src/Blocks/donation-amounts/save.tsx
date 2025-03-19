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

	// Visible if other amount is shown or amount buttons is not empty.
	const visible = other || settings?.some(type => type?.amounts?.length)
	const blockProps = useBlockProps.save({
		className: visible
			? 'fame-form__fieldset fame-form__fieldset--amounts'
			: 'fame-form__hidden',
	})

	if (!visible) {
		return (
			<div {...blockProps}>
				<input
					name="amount"
					type="hidden"
					value={settings?.find(type => type.default)?.defaultAmount || DEFAULT_AMOUNT}
				/>
			</div>
		)
	}

	return (
		<fieldset {...blockProps}>
			<RichText.Content
				tagName="legend"
				className={'fame-form__legend' + (showLegend ? '' : ' screen-reader-text')}
				value={legend || DEFAULT_LEGEND}
			/>

			{settings?.map(type => (
				<div
					key={type.type}
					className={`donation-amounts donation-amounts--${type.type}`}
					data-type={type.type}
					data-default={type.default || undefined}
					data-default-amount={type.defaultAmount ?? DEFAULT_AMOUNT}
					style={{ display: type.default ? undefined : 'none' }}
				>
					{type.amounts?.map(({ value }, idx) => (
						<div className="fame-form__group" key={value}>
							<label
								htmlFor={`${type.type}-amount-${idx}`}
								className="fame-form__label"
							>
								<input
									data-type={type.type}
									className="fame-form__input"
									id={`${type.type}-amount-${idx}`}
									checked={value?.toString() === type.defaultAmount?.toString()}
									name={`amount-radio-${type.type}`}
									value={value}
									type="radio"
								/>
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
								value={type.defaultAmount ?? DEFAULT_AMOUNT}
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
