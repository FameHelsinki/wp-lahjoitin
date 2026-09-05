import React, { CSSProperties, useEffect } from 'react'
import { __ } from '@wordpress/i18n'
import {
	CheckboxControl,
	RadioControl,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components'
import {
	InspectorControls,
	RichText,
	useBlockProps,
	AlignmentToolbar,
	BlockControls,
} from '@wordpress/block-editor'
import {
	DEFAULT_DONATION_TYPE,
	DONATION_TYPES,
	DonationType,
	localizedDonationTypeLabel,
} from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'
import { localizedDefault } from '../common/localized-default.ts'
import DonationTypes from './DonationTypes.tsx'

export type Attributes = {
	legend?: string
	types?: DonationType[]
	value?: string
	showLegend?: boolean
	legendAlign?: string
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * Other form blocks read donation types from this block with useEnabledDonationTypes().
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({
	attributes,
	setAttributes,
	clientId,
}: EditProps<Attributes>): React.JSX.Element {
	const { types, value, legendAlign = 'left' } = attributes
	const localizedLegend = localizedDefault(
		attributes.legend,
		'Donation type',
		__('Donation type', 'fame_lahjoitukset')
	)
	const legendStyle = {
		textAlign: legendAlign as CSSProperties['textAlign'],
		fontFamily: 'inherit',
	}

	useEffect(() => {
		const current = Array.isArray(types) ? types : []

		// Seed a freshly inserted block with the default donation type.
		if (current.length === 0) {
			setAttributes({
				types: [{ value: DEFAULT_DONATION_TYPE.value, label: '' }],
				value: DEFAULT_DONATION_TYPE.value,
			})
			return
		}

		// Keep the default donation type among the enabled ones.
		if (!current.some(type => type.value === value)) {
			setAttributes({ value: current[0].value })
		}
	}, [types, value, setAttributes])

	/**
	 * Enables or disables a single donation type.
	 */
	const toggleEnabledType = (type: string, nextChecked: boolean) => {
		const enabled = new Set((types ?? []).map(({ value: typeValue }) => typeValue))
		if (nextChecked === enabled.has(type)) return
		// The form always needs at least one donation type.
		if (!nextChecked && enabled.size <= 1) return

		if (nextChecked) enabled.add(type)
		else enabled.delete(type)

		const next = DONATION_TYPES.filter(({ value: typeValue }) => enabled.has(typeValue)).map(
			({ value: typeValue }) => ({
				value: typeValue,
				label: types?.find(existing => existing.value === typeValue)?.label ?? '',
			})
		)

		setAttributes({
			types: next,
			value: next.some(({ value: typeValue }) => typeValue === value) ? value : next[0].value,
		})
	}

	const visible = types && types.length > 1

	return (
		<>
			<BlockControls group="block">
				<AlignmentToolbar
					value={legendAlign}
					onChange={next => setAttributes({ legendAlign: next || 'left' })}
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show legend', 'fame_lahjoitukset')}
						help={__(
							'If disabled, the legend is marked visually hidden.',
							'fame_lahjoitukset'
						)}
						checked={attributes.showLegend}
						onChange={showLegend => setAttributes({ showLegend })}
					/>

					<TextControl
						label={__('Legend', 'fame_lahjoitukset')}
						help={__(
							'Description for screen readers (for accessibility).',
							'fame_lahjoitukset'
						)}
						value={localizedLegend}
						onChange={legend => setAttributes({ legend })}
					/>

					<div
						className="donation-type__enabled-types"
						role="group"
						aria-label={__('Enabled donation types', 'fame_lahjoitukset')}
					>
						{DONATION_TYPES.map(({ value: typeValue, label }) => (
							<CheckboxControl
								key={typeValue}
								label={label}
								help={__(
									'Choose the donation type to enable.',
									'fame_lahjoitukset'
								)}
								checked={(types ?? []).some(type => type.value === typeValue)}
								onChange={next => toggleEnabledType(typeValue, next)}
							/>
						))}
					</div>

					{(types?.length ?? 0) > 1 && (
						<RadioControl
							label={__('Default donation type', 'fame_lahjoitukset')}
							help={__(
								'Select donation type that will be used by default.',
								'fame_lahjoitukset'
							)}
							selected={value ?? types?.[0]?.value}
							options={(types ?? []).map(type => ({
								value: type.value,
								label: localizedDonationTypeLabel(type),
							}))}
							onChange={nextValue => setAttributes({ value: nextValue })}
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
								tagName="legend"
								className="fame-form__legend"
								aria-label={__('Legend', 'fame_lahjoitukset')}
								placeholder={__('Donation type', 'fame_lahjoitukset')}
								allowedFormats={[]}
								value={localizedLegend}
								onChange={legend => setAttributes({ legend })}
								style={legendStyle}
							/>
						)}
						<DonationTypes
							types={types}
							value={value}
							onChange={setAttributes}
							name={`donation-type-preview-${clientId}`}
						/>
					</>
				) : (
					<>
						{attributes.showLegend && (
							<RichText
								multiline={false}
								tagName="legend"
								className="fame-form__legend"
								aria-label={__('Legend', 'fame_lahjoitukset')}
								placeholder={__('Donation type', 'fame_lahjoitukset')}
								allowedFormats={[]}
								value={localizedLegend}
								onChange={legend => setAttributes({ legend })}
								style={legendStyle}
							/>
						)}
						<div>
							<div>
								{__('Donation type', 'fame_lahjoitukset')}:{' '}
								{localizedDonationTypeLabel(types?.[0] ?? DEFAULT_DONATION_TYPE)} (
								{__('hidden', 'fame_lahjoitukset')})
							</div>
							<p style={{ color: '#757575', fontSize: 12, margin: '4px 0 0' }}>
								{__(
									'Hidden because only one donation type is enabled.',
									'fame_lahjoitukset'
								)}
							</p>
						</div>
					</>
				)}
			</div>
		</>
	)
}
