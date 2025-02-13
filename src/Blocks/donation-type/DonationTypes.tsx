import React, { FC } from 'react'
import { DonationType } from '../common/donation-type.ts'
import Radio from '../common/Radio.tsx'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'

type Props = {
	onChange: (attributes: { types?: DonationType[]; value?: string }) => void
	/** Enabled types */
	types?: DonationType[]
	/** Default value */
	value?: string
}

const Component: FC<Props> = ({ types, value: defaultValue, onChange }) => (
	<>
		{types?.map(({ value, label }) => (
			<div key={value} className="donation-type__control">
				<Radio
					checked={value === defaultValue}
					onClick={() => onChange({ value })}
					className="donation-type__input"
				/>
				<RichText
					multiline={false}
					className="donation-type__label"
					aria-label={__('Donation type label', 'fame_lahjoitukset')}
					allowedFormats={[]}
					onChange={label =>
						onChange({
							types: types.map(type =>
								type.value !== value ? type : { value, label }
							),
						})
					}
					placeholder={label}
					value={label}
				/>
			</div>
		))}
	</>
)

export default Component
