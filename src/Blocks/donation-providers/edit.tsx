import React from 'react'
import { __ } from '@wordpress/i18n'
import { useBlockProps, InspectorControls } from '@wordpress/block-editor'
import { PanelBody, Flex, CheckboxControl, TextControl, ToggleControl } from '@wordpress/components'
import { EditProps } from '../common/types.ts'
import { PROVIDERS, Provider } from '../common/Providers.ts'

export type Attributes = {
	legend?: string
	providers?: Provider[]
	value?: string
	showLegend?: boolean
}

export default function Edit({ attributes, setAttributes }: EditProps<Attributes>) {
	const {
		providers = [],
		legend = __('Provider type', 'fame_lahjoitukset'),
		showLegend = true,
	} = attributes

	const selected = new Set(providers.map(p => p.value))

	const toggleProvider = (value: string, checked: boolean) => {
		let updated: Provider[]

		if (checked && !selected.has(value)) {
			const label = PROVIDERS.find(p => p.value === value)?.label || value
			updated = [...providers, { value, label }]
		} else if (!checked) {
			updated = providers.filter(p => p.value !== value)
		} else {
			return
		}

		setAttributes({ providers: updated })
	}

	const updateLabel = (value: string, newLabel: string) => {
		const updated = providers.map(p => (p.value === value ? { ...p, label: newLabel } : p))
		setAttributes({ providers: updated })
	}

	const visible = providers.length > 0

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<Flex direction="column" gap={2}>
						{PROVIDERS.map(p => (
							<CheckboxControl
								key={p.value}
								label={p.label}
								checked={selected.has(p.value)}
								onChange={checked => toggleProvider(p.value, checked)}
							/>
						))}

						{providers.map(p => (
							<TextControl
								key={p.value}
								label={`${p.label} ${__('label', 'fame_lahjoitukset')}`}
								value={p.label}
								onChange={val => updateLabel(p.value, val)}
							/>
						))}

						<ToggleControl
							label={__('Show legend', 'fame_lahjoitukset')}
							checked={showLegend}
							onChange={checked => setAttributes({ showLegend: checked })}
						/>

						{visible && showLegend && (
							<TextControl
								label={__('Legend', 'fame_lahjoitukset')}
								help={__('Description for screen readers.', 'fame_lahjoitukset')}
								value={legend}
								onChange={legend => setAttributes({ legend })}
							/>
						)}
					</Flex>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps()}>
				<fieldset className="payment-method-selector">
					{showLegend && legend && (
						<legend className="fame-form__legend">{legend}</legend>
					)}

					{providers.map(p => (
						<div key={p.value}>
							<label htmlFor={`payment_method_${p.value}`}>
								<input
									type="radio"
									id={`payment_method_${p.value}`}
									name="payment_method"
									value={p.value}
									disabled
								/>
								<span className="provider-type__label">{p.label}</span>
							</label>
						</div>
					))}
				</fieldset>
			</div>
		</>
	)
}
