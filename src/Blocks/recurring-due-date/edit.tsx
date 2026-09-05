import React from 'react'
import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor'
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { EditProps } from '../common/types.ts'
import { localizedDefault } from '../common/localized-default.ts'
import './edit.css'

type Attributes = {
	label?: string
	showLabel?: boolean
	defaultDay?: number
}

const dayOptions = Array.from({ length: 28 }, (_, index) => {
	const day = index + 1
	return { label: String(day), value: String(day) }
})

export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
}: EditProps<Attributes>): React.JSX.Element {
	const enabledTypes = context['famehelsinki/donation-types']
	const recurringEnabled =
		!Array.isArray(enabledTypes) ||
		enabledTypes.length === 0 ||
		enabledTypes.includes('recurring')
	const label = localizedDefault(
		attributes.label,
		'Charge day',
		__('Charge day', 'fame_lahjoitukset')
	)
	const savedDefaultDay = attributes.defaultDay ?? 5
	const defaultDay = Number.isFinite(savedDefaultDay)
		? Math.min(28, Math.max(1, savedDefaultDay))
		: 5
	const showLabel = attributes.showLabel ?? true
	const helpId = `recurring-due-date-help-${clientId}`

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show label', 'fame_lahjoitukset')}
						checked={showLabel}
						onChange={nextShowLabel => setAttributes({ showLabel: nextShowLabel })}
					/>
					<SelectControl
						label={__('Default charge day', 'fame_lahjoitukset')}
						help={__(
							'Donors can change this day when making a recurring donation.',
							'fame_lahjoitukset'
						)}
						value={String(defaultDay)}
						options={dayOptions}
						onChange={value => setAttributes({ defaultDay: Number(value) })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps({ className: 'recurring-due-date' })}>
				{recurringEnabled ? (
					<>
						{showLabel && (
							<RichText
								tagName="label"
								className="fame-form__label"
								value={label}
								allowedFormats={[]}
								onChange={nextLabel => setAttributes({ label: nextLabel })}
							/>
						)}
						<div
							className="fame-form__fake-input"
							aria-describedby={helpId}
						>
							{defaultDay}
						</div>
						<p className="fame-form__help" id={helpId}>
							{__(
								'The donation will be charged on this day each month.',
								'fame_lahjoitukset'
							)}
						</p>
					</>
				) : (
					<div>
						<div>
							{label} ({__('hidden', 'fame_lahjoitukset')})
						</div>
						<p className="recurring-due-date__hidden-help">
							{__(
								'Hidden because recurring donations are not enabled.',
								'fame_lahjoitukset'
							)}
						</p>
					</div>
				)}
			</div>
		</>
	)
}
