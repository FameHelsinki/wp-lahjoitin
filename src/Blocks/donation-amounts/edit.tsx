import React, { useEffect } from 'react'
import { __ } from '@wordpress/i18n'
import { Button, Flex, PanelBody, TextControl, ToggleControl } from '@wordpress/components'
import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor'
import { getDonationLabel, useCurrentDonationType } from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'
import {
	AmountSetting,
	DEFAULT_AMOUNT,
	DEFAULT_LEGEND,
	DEFAULT_UNIT,
	isVisible,
	nextAmount,
	spliceSettings,
} from '../common/donation-amount.ts'
import AmountControl from './AmountControl.tsx'
import AmountSettingsControl from './AmountSettingsControl.tsx'
import EditContent from './EditContent.tsx'

export type Attributes = {
	settings?: AmountSetting[]
	showLegend?: boolean
	legend?: string
	other?: boolean
	otherLabel?: string
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
	clientId,
}: EditProps<Attributes>): React.JSX.Element {
	const { 'famehelsinki/donation-types': types } = context
	const { settings, other, legend, showLegend, otherLabel } = attributes
	const currentType = useCurrentDonationType(clientId)
	const current = settings?.find(({ type }) => type === currentType)

	// Filter invalid types from attributes.
	useEffect(() => {
		if (settings?.some(({ type }) => !types?.includes(type))) {
			setAttributes({
				settings: settings?.filter(({ type }) => types.includes(type)),
			})
		}
	}, [types, settings, setAttributes])

	useEffect(() => {
		if (!currentType) {
			return
		}

		const existing = settings?.find(({ type }) => type !== currentType)
		if (existing?.default) {
			return
		}

		const newSettings =
			settings?.map(setting => {
				setting.default = setting.type === currentType
				return setting
			}) ?? []

		// Initialize new type with default values.
		if (!existing) {
			newSettings.push({
				type: currentType,
				default: true,
				defaultAmount: DEFAULT_AMOUNT,
				unit: DEFAULT_UNIT,
				// Copy existing amounts from first available.
				amounts: settings?.find(type => type?.amounts?.length)?.amounts ?? [],
			})
		}
		setAttributes({
			settings: newSettings,
		})
	}, [currentType, settings, setAttributes])

	// Visible if other amount is shown or amount buttons is not empty.
	const visible = isVisible(other, settings)

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show other amount', 'fame_lahjoitukset')}
						help={__('Show other amount input field', 'fame_lahjoitukset')}
						checked={other}
						onChange={value => setAttributes({ other: value })}
					/>
					<ToggleControl
						label={__('Show legend', 'fame_lahjoitukset')}
						help={__(
							'If disabled, the legend is marked visually hidden.',
							'fame_lahjoitukset'
						)}
						disabled={!visible}
						checked={visible && showLegend}
						onChange={value => setAttributes({ showLegend: value })}
					/>
					{visible && !showLegend && (
						<TextControl
							label={__('Legend', 'fame_lahjoitukset')}
							help={__('Description for screen readers.', 'fame_lahjoitukset')}
							value={legend ?? DEFAULT_LEGEND}
							onChange={value => setAttributes({ legend: value })}
						/>
					)}
					<Flex justify="initial">
						<Button
							variant="primary"
							onClick={() =>
								setAttributes({
									settings: settings?.map(type => {
										if (!type.amounts) {
											type.
										}

										return type
									}),
								})
							}
						>
							{__('Add button', 'fame_lahjoitukset')}
						</Button>
						<Button
							variant="primary"
							disabled={derived.every(({ amounts }) => !amounts.length)}
							onClick={() =>
								setAttributes({
									amounts: derived.flatMap(({ amounts }) =>
										amounts.toSpliced(-1)
									),
								})
							}
						>
							{__('Remove button', 'fame_lahjoitukset')}
						</Button>
					</Flex>
				</PanelBody>
				{derived.map(({ type, amounts, ...settings }) => (
					<PanelBody title={getDonationLabel(type)} key={type}>
						<AmountSettingsControl
							type={type}
							other={other}
							visible={visible}
							amounts={amounts}
							settings={settings}
							showLegend={showLegend}
							onChange={value => {
								setAttributes({
									settings: spliceSettings(attributes.settings, value),
								})
							}}
						/>
						<AmountControl
							type={type}
							amounts={amounts}
							settings={settings}
							onChange={(value, newSettings) =>
								setAttributes({
									// Changing amount can update default value.
									settings: spliceSettings(attributes.settings, newSettings),
									amounts: (attributes.amounts ?? [])
										// Filter out all amounts with given type.
										.filter(item => item.type !== type)
										// Concatenate with new amounts.
										.concat(value),
								})
							}
						/>
					</PanelBody>
				))}
			</InspectorControls>
			<div {...useBlockProps({ className: 'donation-amounts' })}>
				{visible && showLegend && (
					<RichText
						multiline={false}
						className="donation-amounts__legend"
						aria-label={__('Donation amount legend', 'fame_lahjoitukset')}
						placeholder={__('Donation amount', 'fame_lahjoitukset')}
						allowedFormats={[]}
						value={legend ?? DEFAULT_LEGEND}
						onChange={value => setAttributes({ legend: value })}
					/>
				)}
				<EditContent
					current={current}
					other={other}
					otherLabel={otherLabel}
					setAttributes={setAttributes}
				/>
			</div>
		</>
	)
}
