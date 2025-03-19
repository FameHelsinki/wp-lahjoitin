import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { DEFAULT_DONATION_TYPE } from '../common/donation-type.ts'
import { SaveProps } from '../common/types.ts'
import { Attributes } from './edit.tsx'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function save({ attributes }: SaveProps<Attributes>): React.JSX.Element {
	const { legend, showLegend, types, value: defaultValue } = attributes
	const isHidden = !Array.isArray(types) || types.length <= 1
	const blockProps = useBlockProps.save({
		className: isHidden
			? 'fame-form__hidden'
			: 'fame-form__fieldset fame-form__fieldset--donation-type',
	})

	if (isHidden) {
		return (
			<div {...blockProps}>
				<input
					type="hidden"
					name="type"
					value={types?.[0]?.value ?? DEFAULT_DONATION_TYPE.value}
				/>
			</div>
		)
	}

	return (
		<fieldset {...blockProps}>
			<RichText.Content
				tagName="legend"
				className={'fame-form__legend' + (showLegend ? '' : ' screen-reader-text')}
				value={legend ?? ''}
			/>
			{types.map(({ value, label }) => (
				<div key={value} className="fame-form__group">
					<label htmlFor={`donation-type-${value}`} className="fame-form__label">
						<input
							id={`donation-type-${value}`}
							className="fame-form__check-input"
							checked={value === defaultValue}
							type="radio"
							name="type"
							value={value}
						/>
						{label}
					</label>
				</div>
			))}
		</fieldset>
	)
}
