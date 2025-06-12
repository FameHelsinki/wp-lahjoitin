import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { SaveProps } from '../common/types.ts'

type Provider = { value: string; label: string }

export default function Save({
	attributes,
}: SaveProps<{
	providers?: Record<string, Provider[]>
	legend?: string
	showLegend?: boolean
}>): React.JSX.Element {
	const { providers = {}, legend = 'Provider type', showLegend = true } = attributes
	const flatProviders = Array.isArray(providers) ? providers : []

	return (
		<div {...useBlockProps.save()}>
			<fieldset className="payment-method-selector">
				{showLegend && <legend className="fame-form__legend">{legend}</legend>}

				{flatProviders.map(p => (
					<div key={`${p.type}-${p.value}`} data-type={p.type}>
						<label htmlFor={`payment_method_${p.type}_${p.value}`}>
							<input
								type="radio"
								id={`payment_method_${p.type}_${p.value}`}
								name="provider"
								value={p.value}
								data-type={p.type}
								required
							/>
							<span className="provider-type__label">{p.label}</span>
						</label>
					</div>
				))}
			</fieldset>
		</div>
	)
}
