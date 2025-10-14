import React, { useMemo, useEffect } from 'react'
import { __ } from '@wordpress/i18n'
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor'
import { PanelBody, Flex, CheckboxControl, TextControl, ToggleControl } from '@wordpress/components'
import { EditProps } from '../common/types.ts'
import { PROVIDERS, Provider } from '../common/Providers.ts'
import { getDonationLabel, useCurrentDonationType } from '../common/donation-type.ts'

export type FlatProvider = Provider & { type: string }

export type Attributes = {
	legend?: string
	providers?: FlatProvider[]
	showLegend?: boolean
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */ export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
}: EditProps<Attributes>) {
	const {
		providers = [],
		legend = __('Provider type', 'fame_lahjoitukset'),
		showLegend = true,
	} = attributes

	const donationTypes: string[] = useMemo(
		() => context['famehelsinki/donation-types'] || [],
		[context]
	)

	const currentType = useCurrentDonationType(clientId)

	const blockProps = useBlockProps()

	useEffect(() => {
		const missing = donationTypes.filter(type => !providers.some(p => p.type === type))
		if (!missing.length) return

		const defaults = missing
			.map(type => {
				const match = PROVIDERS.find(p => p.types.includes(type))
				return match ? ({ ...match, type } as FlatProvider) : null
			})
			.filter(Boolean) as FlatProvider[]

		if (defaults.length) setAttributes({ providers: [...providers, ...defaults] })
	}, [donationTypes, providers, setAttributes])

	useEffect(() => {
		const cleaned = providers.filter(p => donationTypes.includes(p.type))
		if (cleaned.length !== providers.length) setAttributes({ providers: cleaned })
	}, [donationTypes, providers, setAttributes])

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
				const data = PROVIDERS.find(p => p.value === value)
				if (!data) return
				updated = [...current, { ...data, type: donationType }]
			}
		} else {
			updated = current.filter(p => p.value !== value)
		}

		const newGrouped = { ...grouped, [donationType]: updated }
		setAttributes({
			providers: Object.entries(newGrouped).flatMap(([t, list]) =>
				list.map(p => ({ ...p, type: t }))
			),
		})
	}

	const updateLabel = (donationType: string, value: string, label: string) => {
		const current = grouped[donationType] ?? []
		const updated = current.map(p => (p.value === value ? { ...p, label } : p))
		const newGrouped = { ...grouped, [donationType]: updated }

		setAttributes({
			providers: Object.entries(newGrouped).flatMap(([t, list]) =>
				list.map(p => ({ ...p, type: t }))
			),
		})
	}

	return (
		<>
			<InspectorControls>
				{donationTypes.map(type => {
					const selected = new Set((grouped[type] ?? []).map(p => p.value))
					return (
						<PanelBody title={getDonationLabel(type)} key={type}>
							<Flex direction="column" gap={2}>
								{PROVIDERS.filter(p => p.types.includes(type)).map(p => (
									<CheckboxControl
										key={p.value}
										label={p.label}
										checked={selected.has(p.value)}
										onChange={checked => updateProvider(type, p.value, checked)}
									/>
								))}
								{(grouped[type] ?? []).map(p => (
									<TextControl
										key={p.value}
										label={`${p.label} ${__('label', 'fame_lahjoitukset')}`}
										value={p.label}
										onChange={val => updateLabel(type, p.value, val)}
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
				{Object.entries(grouped).map(([type, list]) => {
					if (currentType && type !== currentType) return null

					const isSingle = list.length === 1

					return (
						<fieldset
							key={type}
							className="payment-method-selector fame-form__fieldset"
							style={{ width: '100%', boxSizing: 'border-box' }}
							data-type={type}
						>
							{showLegend && (
								<RichText
									multiline={false}
									className="fame-form__legend"
									aria-label={__('Legend', 'fame_lahjoitukset')}
									placeholder={__('Donation type', 'fame_lahjoitukset')}
									allowedFormats={[]}
									value={attributes.legend ?? ''}
									onChange={le => setAttributes({ legend: le })}
								/>
							)}

							{isSingle ? (
								<div className="fame-form__group" data-type={type}>
									<RichText
										tagName="span"
										className="provider-type__label"
										value={list[0].label}
										onChange={val => updateLabel(type, list[0].value, val)}
										allowedFormats={[]}
										placeholder={__('Label', 'fame_lahjoitukset')}
									/>
								</div>
							) : (
								list.map(p => (
									<div
										className="fame-form__group"
										key={`${type}-${p.value}`}
										data-type={type}
									>
										<label htmlFor={`payment_method_${type}_${p.value}`}>
											<input
												type="radio"
												id={`payment_method_${type}_${p.value}`}
												name={`payment_method_${type}`}
												value={p.value}
												disabled
											/>
											<RichText
												tagName="span"
												className="provider-type__label"
												value={p.label}
												onChange={val => updateLabel(type, p.value, val)}
												allowedFormats={[]}
												placeholder={__('Label', 'fame_lahjoitukset')}
											/>
										</label>
									</div>
								))
							)}
						</fieldset>
					)
				})}
			</div>
		</>
	)
}
