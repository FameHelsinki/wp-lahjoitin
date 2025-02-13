import React, { FC } from 'react'
import { AmountSetting, DerivedAmount, spliceSettings } from '../common/donation-amount.ts'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'

type Props = {
	current?: DerivedAmount
	settings?: AmountSetting[]
	showLegend?: boolean
	other?: boolean
	otherLabel?: string
	setAttributes: (attributes: any) => void
}

const EditContent: FC<Props> = ({
	current,
	settings,
	showLegend,
	other,
	otherLabel,
	setAttributes,
}) => {
	if (!current) return null

	if (!other && !current.amounts.length) {
		return `Amount: ${current.amount} (hidden)`
	}

	return (
		<>
			{showLegend && (
				<RichText
					multiline={false}
					className="donation-amounts__legend"
					aria-label={__('Donation amount legend', 'fame_lahjoitukset')}
					placeholder={__('Donation amount', 'fame_lahjoitukset')}
					allowedFormats={[]}
					value={current.legend}
					onChange={value =>
						setAttributes({
							settings: spliceSettings(settings, {
								...current,
								legend: value,
							}),
						})
					}
				/>
			)}

			<div className="donation-amounts__controls">
				{current.amounts.map(({ amount }) => (
					<div
						className={
							'donation-amounts__amount' +
							(current.amount === amount ? ' donation-amounts__amount--default' : '')
						}
						key={amount}
					>
						{amount} {current.unit}
					</div>
				))}

				{other && (
					<div className="donation-amounts__other">
						<RichText
							multiline={false}
							tagName="div"
							aria-label={__('Other amount text', 'fame_lahjoitukset')}
							allowedFormats={['core/bold', 'core/italic']}
							onChange={value => setAttributes({ otherLabel: value })}
							placeholder={__('Other amount', 'fame_lahjoitukset')}
							value={otherLabel ?? __('Other amount', 'fame_lahjoitukset')}
						/>
						{/* Placeholder mimics input field in Gutenberg UI. */}
						<div className="donation-amounts__other__placeholder">
							{current.amount} {current.unit}
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default EditContent
