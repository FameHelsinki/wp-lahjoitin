import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { SaveProps } from '../common/types.ts'

type Provider = { value: string; label: string; type: string }

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function Save({
	attributes,
}: SaveProps<{
	providers?: Provider[]
	legend?: string
	showLegend?: boolean
}>): React.JSX.Element {
	const { providers = [], legend = 'Provider type', showLegend = true } = attributes
	const blockProps = useBlockProps.save()

	const grouped = providers.reduce<Record<string, Provider[]>>((acc, p) => {
		if (!acc[p.type]) acc[p.type] = []
		acc[p.type].push(p)
		return acc
	}, {})

	return (
		<div {...blockProps}>
			{Object.entries(grouped).map(([type, list]) => (
				<fieldset className="payment-method-selector" data-type={type} key={type}>
					{showLegend && <legend className="fame-form__legend">{legend}</legend>}
					{list.length === 1 && (
						<input
							type="hidden"
							name="provider"
							value={list[0].value}
							data-type={list[0].type}
						/>
					)}
					{list.map(provider => (
						<div
							className="fame-form__group"
							key={`${provider.type}-${provider.value}`}
							data-type={provider.type}
						>
							<label htmlFor={`payment_method_${provider.type}_${provider.value}`}>
								<input
									type="radio"
									id={`payment_method_${provider.type}_${provider.value}`}
									name="provider"
									value={provider.value}
									data-type={provider.type}
									required={true}
								/>
								<span className="provider-type__label">{provider.label}</span>
							</label>
						</div>
					))}
				</fieldset>
			))}
		</div>
	)
}
