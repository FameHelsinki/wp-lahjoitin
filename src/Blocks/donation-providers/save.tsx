import React from 'react'
import { RichText, useBlockProps } from '@wordpress/block-editor'
import { SaveProps } from '../common/types.ts'

type Provider = { value: string; label: string; type: string }

type Attrs = {
	providers?: Provider[]
	legend?: string
	// old (fallback)
	showLegend?: boolean
	showLegendSingle?: boolean
	showLegendRecurring?: boolean
}

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function Save({ attributes }: SaveProps<Attrs>): React.JSX.Element {
	const {
		providers = [],
		legend = 'Payment provider',
		showLegend = true,
		showLegendSingle,
		showLegendRecurring,
	} = attributes

	const blockProps = useBlockProps.save()

	const grouped = providers.reduce<Record<string, Provider[]>>((acc, p) => {
		;(acc[p.type] ||= []).push(p)
		return acc
	}, {})

	const isLegendShownForType = (type: string) => {
		if (type === 'single') return showLegendSingle ?? showLegend ?? true
		if (type === 'recurring') return showLegendRecurring ?? showLegend ?? true
		return showLegend ?? true
	}

	return (
		<div {...blockProps}>
			{Object.entries(grouped).map(([type, list]) => {
				const single = list.length === 1
				const showForType = isLegendShownForType(type)

				return (
					<fieldset
						className="payment-method-selector fame-form__fieldset"
						data-type={type}
						key={type}
					>
						<RichText.Content
							tagName="legend"
							className={
								'fame-form__legend' + (showForType ? '' : ' screen-reader-text')
							}
							value={legend ?? ''}
						/>

						{single && (
							<input
								type="hidden"
								name="provider"
								value={list[0].value}
								data-type={list[0].type}
							/>
						)}

						{list.map(provider => {
							const hideSingleLabel = single && !showForType

							return (
								<div
									className={
										'fame-form__group' +
										(hideSingleLabel ? ' screen-reader-text' : '')
									}
									key={`${provider.type}-${provider.value}`}
									data-type={provider.type}
								>
									<label
										htmlFor={`payment_method_${provider.type}_${provider.value}`}
									>
										<input
											className="fame-form__check-input"
											type="radio"
											id={`payment_method_${provider.type}_${provider.value}`}
											name="provider"
											value={provider.value}
											data-type={provider.type}
											required={true}
										/>
										<RichText.Content
											tagName="span"
											className="provider-type__label"
											value={provider.label}
										/>
									</label>
								</div>
							)
						})}
					</fieldset>
				)
			})}
		</div>
	)
}
