import React, { useEffect } from 'react'
import { __ } from '@wordpress/i18n'
import { RadioControl, PanelBody, TextControl, ToggleControl } from '@wordpress/components'
import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor'
import { DEFAULT_DONATION_TYPE, DONATION_TYPES, DonationType } from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'
import DonationTypes from './DonationTypes.tsx'

export type Attributes = {
	legend?: string
	types?: DonationType[]
	value?: string
	showLegend?: boolean
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({
	context,
	attributes,
	setAttributes,
}: EditProps<Attributes>): React.JSX.Element {
	const { 'famehelsinki/donation-types': enabledTypes } = context
	const { types, value } = attributes

	useEffect(() => {
		const enabled =
			Array.isArray(enabledTypes) && enabledTypes.length > 0
				? enabledTypes
				: DONATION_TYPES.map(t => t.value)

		// Calculate updated types.
		//  - enabled types might have changed.
		//  - enabled types might have been removed.
		const update = DONATION_TYPES
			// Filter all enabled types.
			.filter(({ value }) => enabled.includes(value))
			// Use existing type from if it exists, otherwise add
			// new with default label from DONATION_TYPES array.
			.map(t => types?.find(({ value }) => t.value === value) ?? t)

		// Calculate default value. Use existing if it exists in updated list, otherwise use first from updated list or fallback to default.
		const defaultValue =
			update?.find(type => type.value === value)?.value ??
			update?.[0]?.value ??
			DEFAULT_DONATION_TYPE.value

		// Update if the list has changed. Calling setAttributes
		// without this check leads to infinite recursion.
		// This assumes that DONATION_TYPES and types attribute
		// have the same order.
		if (
			update?.length !== types?.length ||
			!update.every((item, idx) => item.value === types?.[idx]?.value)
		) {
			setAttributes({
				types: update,
				value: defaultValue,
			})
		} else if (value !== defaultValue) {
			setAttributes({
				value: defaultValue,
			})
		}
	}, [types, value, enabledTypes, setAttributes])

	const visible = types && types.length > 1

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					{types?.length && types?.length > 1 && (
						<RadioControl
							label={__('Default donation type', 'fame_lahjoitukset')}
							help={__(
								'Select donation type that will be used by default.',
								'fame_lahjoitukset'
							)}
							selected={value ?? types?.[0]?.value}
							options={types}
							onChange={value => setAttributes({ value })}
						/>
					)}
					<ToggleControl
						label={__('Show legend', 'fame_lahjoitukset')}
						help={__(
							'If disabled, the legend is marked visually hidden.',
							'fame_lahjoitukset'
						)}
						disabled={!visible}
						checked={visible && attributes.showLegend}
						onChange={showLegend => setAttributes({ showLegend })}
					/>
					{visible && !attributes.showLegend && (
						<TextControl
							label={__('Legend', 'fame_lahjoitukset')}
							help={__('Description for screen readers.', 'fame_lahjoitukset')}
							value={attributes.legend ?? __('Donation type')}
							onChange={legend => setAttributes({ legend })}
						/>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...useBlockProps({ className: 'donation-type' })}>
				{visible ? (
					<>
						{attributes.showLegend && (
							<RichText
								multiline={false}
								className="fame-form__legend"
								aria-label={__('Legend', 'fame_lahjoitukset')}
								placeholder={__('Donation type', 'fame_lahjoitukset')}
								allowedFormats={[]}
								value={attributes.legend ?? ''}
								onChange={legend => setAttributes({ legend })}
							/>
						)}
						<DonationTypes types={types} value={value} onChange={setAttributes} />
					</>
				) : (
					`Type: ${types?.[0]?.value ?? DEFAULT_DONATION_TYPE.value} (hidden)`
				)}
			</div>
		</>
	)
}
