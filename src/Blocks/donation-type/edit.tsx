import { InspectorControls, useBlockProps } from '@wordpress/block-editor'
import { RadioControl, PanelBody } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import React, { useEffect } from 'react'
import DonationTypes from './DonationTypes.tsx'
import { DEFAULT_DONATION_TYPE, DONATION_TYPES, DonationType } from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({ context, attributes, setAttributes }: EditProps): React.JSX.Element {
	const { 'famehelsinki/donation-types': enabledTypes } = context
	const { types, value } = attributes as {
		types?: DonationType[]
		value?: string
	}

	useEffect(() => {
		// Calculate updated types.
		//  - enabled types might have changed.
		//  - enabled types might have been removed.
		const update = DONATION_TYPES
			// Filter all enabled types.
			.filter(({ value }) => enabledTypes?.includes(value))
			// Use existing type from if it exists, otherwise add
			// new with default label from DONATION_TYPES array.
			.map(t => types?.find(({ value }) => t.value === value) ?? t)

		// Check if update includes current default value.
		// If not, set first element as the new default value.
		const defaultValue = update?.find(type => type.value === value)?.value || update?.[0]?.value

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
				</PanelBody>
			</InspectorControls>
			<div {...useBlockProps({ className: 'donation-type' })}>
				{/* todo: add legend here */}
				<div className="donatin-type__controls">
					{types?.length && types.length > 1 ? (
						<DonationTypes types={types} value={value} onChange={setAttributes} />
					) : (
						`Type: ${types?.[0]?.value ?? DEFAULT_DONATION_TYPE.value} (hidden)`
					)}
				</div>
			</div>
		</>
	)
}
