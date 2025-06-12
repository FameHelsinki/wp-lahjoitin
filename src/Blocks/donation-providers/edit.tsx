import React, { useMemo, useEffect } from 'react'
import { __ } from '@wordpress/i18n'
import { useBlockProps, InspectorControls } from '@wordpress/block-editor'
import { PanelBody, Flex, CheckboxControl, TextControl, ToggleControl } from '@wordpress/components'
import { EditProps } from '../common/types.ts'
import { PROVIDERS, Provider } from '../common/Providers.ts'
import { getDonationLabel } from '../common/donation-type.ts'

export type FlatProvider = Provider & { type: string }

export type Attributes = {
	legend?: string
	providers?: FlatProvider[]
	showLegend?: boolean
}

export default function Edit({ attributes, setAttributes, context }: EditProps<Attributes>) {
	const {
		providers = [],
		legend = __('Provider type', 'fame_lahjoitukset'),
		showLegend = true,
	} = attributes

	const donationTypes: string[] = useMemo(() => {
		return context['famehelsinki/donation-types'] || []
	}, [context])
	const blockProps = useBlockProps()

	// Remove providers which type is no longer selected
	useEffect(() => {
		const cleaned = providers.filter(p => donationTypes.includes(p.type))
		if (cleaned.length !== providers.length) {
			setAttributes({ providers: cleaned })
		}
	}, [donationTypes, providers, setAttributes])

	// Group by type
	const grouped = providers.reduce<Record<string, FlatProvider[]>>((acc, p) => {
		if (!acc[p.type]) acc[p.type] = []
		acc[p.type].push(p)
		return acc
	}, {})

	const updateProvider = (donationType: string, value: string, checked: boolean) => {
		const current = grouped[donationType] ?? []
		const exists = current.find(p => p.value === value)

		let updated: FlatProvider[]

		if (checked) {
			if (exists) {
				updated = current
			} else {
				const providerData = PROVIDERS.find(p => p.value === value)
				if (!providerData) return

				updated = [
					...current,
					{
						...providerData,
						type: donationType,
					},
				]
			}
		} else {
			updated = current.filter(p => p.value !== value)
		}

		const newGrouped = { ...grouped, [donationType]: updated }

		setAttributes({
			providers: Object.entries(newGrouped).flatMap(([groupType, list]) =>
				list.map(p => ({ ...p, type: groupType }))
			),
		})
	}

	const updateLabel = (donationType: string, value: string, label: string) => {
		const current = grouped[donationType] ?? []
		const updated = current.map(p => (p.value === value ? { ...p, label } : p))

		const newGrouped = { ...grouped, [donationType]: updated }

		setAttributes({
			providers: Object.entries(newGrouped).flatMap(([groupType, list]) =>
				list.map(p => ({ ...p, type: groupType }))
			),
		})
	}

	return (
		<>
			<InspectorControls>
				{donationTypes.map(donationType => {
					const selected = new Set((grouped[donationType] ?? []).map(p => p.value))
					return (
						<PanelBody title={getDonationLabel(donationType)} key={donationType}>
							<Flex direction="column" gap={2}>
								{PROVIDERS.filter(p => p.types.includes(donationType)).map(p => (
									<CheckboxControl
										key={p.value}
										label={p.label}
										checked={selected.has(p.value)}
										onChange={checked =>
											updateProvider(donationType, p.value, checked)
										}
									/>
								))}

								{(grouped[donationType] ?? []).map(p => (
									<TextControl
										key={p.value}
										label={`${p.label} ${__('label', 'fame_lahjoitukset')}`}
										value={p.label}
										onChange={val => updateLabel(donationType, p.value, val)}
									/>
								))}
							</Flex>
						</PanelBody>
					)
				})}
				<PanelBody title={__('General settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show legend', 'fame_lahjoitukset')}
						checked={showLegend}
						onChange={checked => setAttributes({ showLegend: checked })}
					/>
					<TextControl
						label={__('Legend', 'fame_lahjoitukset')}
						value={legend}
						onChange={value => setAttributes({ legend: value })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<fieldset className="payment-method-selector">
					{showLegend && <legend className="fame-form__legend">{legend}</legend>}
					{donationTypes.map(type =>
						(grouped[type] ?? []).map(p => (
							<div key={`${type}-${p.value}`} data-type={type}>
								<label htmlFor={`payment_method_${type}_${p.value}`}>
									<input
										type="radio"
										id={`payment_method_${type}_${p.value}`}
										name={`payment_method_${type}`}
										value={p.value}
										disabled
									/>
									<span className="provider-type__label">{p.label}</span>
								</label>
							</div>
						))
					)}
				</fieldset>
			</div>
		</>
	)
}
