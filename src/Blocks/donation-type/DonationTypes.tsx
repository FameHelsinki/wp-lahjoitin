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
						value={value}
						className="fame-form__check-input"
						checked={value === defaultValue}
						onChange={() => onChange({ value })}
					/>
					<svg
						className="donation-type__checkmark"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
					>
						<path d="M9.55,18l-5.7-5.7l1.43-1.42l4.28,4.28l9.18-9.18L20.15,7.4L9.55,18Z" />
					</svg>
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
