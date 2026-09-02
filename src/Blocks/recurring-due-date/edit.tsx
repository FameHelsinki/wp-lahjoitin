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
	allowDonorSelection?: boolean
	defaultDay?: number
}

const dayOptions = Array.from({ length: 28 }, (_, index) => {
	const day = index + 1
	return { label: String(day), value: String(day) }
})

function HiddenPreview({ title, help }: { title: React.ReactNode; help: string }) {
	return (
		<div>
			<div className="fame-form__label">
				{title} ({__('hidden', 'fame_lahjoitukset')})
			</div>
			<p className="recurring-due-date__hidden-help">{help}</p>
		</div>
	)
}

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
	const allowDonorSelection = attributes.allowDonorSelection ?? true
	const selectId = `recurring-due-date-preview-${clientId}`

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show charge date select', 'fame_lahjoitukset')}
						help={__(
							'Allow donors to choose the monthly charge date.',
							'fame_lahjoitukset'
						)}
						checked={allowDonorSelection}
						onChange={nextAllowDonorSelection =>
							setAttributes({ allowDonorSelection: nextAllowDonorSelection })
						}
					/>
					{allowDonorSelection && (
						<ToggleControl
							label={__('Show label', 'fame_lahjoitukset')}
							checked={showLabel}
							onChange={nextShowLabel => setAttributes({ showLabel: nextShowLabel })}
						/>
					)}
					<SelectControl
						label={
							allowDonorSelection
								? __('Default charge day', 'fame_lahjoitukset')
								: __('Set charge date', 'fame_lahjoitukset')
						}
						help={
							allowDonorSelection
								? __(
										'Donors can change this day when making a recurring donation.',
										'fame_lahjoitukset'
									)
								: __(
										'This date is used for monthly donations.',
										'fame_lahjoitukset'
									)
						}
						value={String(defaultDay)}
						options={dayOptions}
						onChange={value => setAttributes({ defaultDay: Number(value) })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps({ className: 'recurring-due-date' })}>
				{recurringEnabled && allowDonorSelection && (
					<>
						{showLabel && (
							<RichText
								tagName="label"
								className="fame-form__label"
								htmlFor={selectId}
								value={label}
								allowedFormats={[]}
								onChange={nextLabel => setAttributes({ label: nextLabel })}
							/>
						)}
						<select
							id={selectId}
							className="fame-form__input"
							aria-label={showLabel ? undefined : label}
							value={defaultDay}
							onChange={event =>
								setAttributes({ defaultDay: Number(event.target.value) })
							}
						>
							{dayOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<p className="fame-form__help">
							{__(
								'The donation will be charged on this day each month.',
								'fame_lahjoitukset'
							)}
						</p>
					</>
				)}
				{recurringEnabled && !allowDonorSelection && (
					<HiddenPreview
						title={
							<>
								{__('Charge date', 'fame_lahjoitukset')}: {defaultDay}
							</>
						}
						help={__(
							'Hidden because the charge date is set in the block settings.',
							'fame_lahjoitukset'
						)}
					/>
				)}
				{!recurringEnabled && (
					<HiddenPreview
						title={label}
						help={__(
							'Hidden because recurring donations are not enabled.',
							'fame_lahjoitukset'
						)}
					/>
				)}
			</div>
		</>
	)
}
