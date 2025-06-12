import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { SaveProps } from '../common/types.ts'

type ProviderData = { value: string; label: string }

export default function Save({
	attributes,
}: SaveProps<{
	providers?: ProviderData[]
	legend?: string
	showLegend?: boolean
}>): React.JSX.Element {
	const { providers = [], legend = 'Provider type', showLegend = true } = attributes

	return (
		<div {...useBlockProps.save()}>
			<fieldset className="payment-method-selector">
				{showLegend && legend && <legend className="fame-form__legend">{legend}</legend>}
				{providers.map(p => (
					<div key={p.value}>
						<label htmlFor={`payment_method_${p.value}`}>
							<input
								type="radio"
								id={`payment_method_${p.value}`}
								name="payment_method"
								value={p.value}
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
