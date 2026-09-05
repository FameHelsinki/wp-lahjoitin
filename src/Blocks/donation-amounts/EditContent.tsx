import React, { FC } from 'react'
import { AmountSetting, DEFAULT_AMOUNT } from '../common/donation-amount.ts'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'
import { localizedDefault } from '../common/localized-default.ts'

type Props = {
	current?: AmountSetting
	showLegend?: boolean
	other?: boolean
	otherLabel?: string
	setAttributes: (attributes: any) => void
	onChangeSetting: (value: AmountSetting) => void
}

const EditContent: FC<Props> = ({ current, other, otherLabel, setAttributes, onChangeSetting }) => {
	if (!current) return null

	if (!other && !current?.amounts?.length) {
		return `${__('Amount', 'fame_lahjoitukset')}: ${current?.defaultAmount} (${__(
			'hidden',
			'fame_lahjoitukset'
		)})`
	}

	const localizedOtherLabel = localizedDefault(
		otherLabel,
		'Other amount',
		__('Other amount', 'fame_lahjoitukset')
	)

	return (
		<>
			<div className={`donation-amounts donation-amounts--${current.type ?? ''}`}>
				{current.amounts
					?.filter(({ value }) => value)
					?.map(({ value }) => (
						<div className="fame-form__group" key={`${current.type}-${value}`}>
							<div
								className={
									'fame-form__label' +
									(+(current.defaultAmount ?? DEFAULT_AMOUNT) === +value!
										? ' fame-form__label--default'
										: '')
								}
							>
								{value}{' '}
								<span className="donation-amounts__unit">{current.unit}</span>
							</div>
						</div>
					))}
			</div>
			{other && (
				<div className="donation-amounts__other-edit">
					<RichText
						multiline={false}
						tagName="div"
						aria-label={__('Other amount text', 'fame_lahjoitukset')}
						allowedFormats={['core/bold', 'core/italic']}
						onChange={value => setAttributes({ otherLabel: value })}
						placeholder={__('Other amount', 'fame_lahjoitukset')}
						value={localizedOtherLabel}
						className="donation-amounts__other-label"
					/>
					{/* Placeholder mimics input field in Gutenberg UI. */}
					<div className="donation-amounts__other__placeholder">
						{current.defaultAmount} {current.unit}
					</div>
					<RichText
						tagName="small"
						multiline={false}
						className="fame-form__help"
						allowedFormats={[]}
						aria-label={__('Help text', 'fame_lahjoitukset')}
						placeholder={__('Help text', 'fame_lahjoitukset')}
						value={current.helpText ?? ''}
						onChange={value => onChangeSetting({ ...current, helpText: value })}
					/>
				</div>
			)}
		</>
	)
}

export default EditContent
