import React, { FC } from 'react'
import { DonationType, localizedDonationTypeLabel } from '../common/donation-type.ts'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'

type Props = {
	onChange: (attributes: { types?: DonationType[]; value?: string }) => void
	/** Unique native radio-group name for this block instance. */
	name: string
	/** Enabled types */
	types?: DonationType[]
	/** Default value */
	value?: string
}

const Component: FC<Props> = ({ types, value: defaultValue, onChange, name }) => (
	<div className="donation-type__controls">
		{types?.map(({ value, label }) => (
			<div key={value} className="donation-type__control fame-form__group">
				<label htmlFor={`${name}-${value}`} className="fame-form__label">
					<input
						id={`${name}-${value}`}
						type="radio"
						name={name}
						className="fame-form__check-input"
						checked={value === defaultValue}
						onChange={() => onChange({ value })}
					/>
					<RichText
						multiline={false}
						aria-label={__('Donation type', 'fame_lahjoitukset')}
						allowedFormats={[]}
						onChange={newLabel =>
							onChange({
								types: types.map(type =>
									type.value !== value ? type : { value, label: newLabel }
								),
							})
						}
						placeholder={localizedDonationTypeLabel({ value, label })}
						value={localizedDonationTypeLabel({ value, label })}
					/>
				</label>
			</div>
		))}
	</div>
)

export default Component
