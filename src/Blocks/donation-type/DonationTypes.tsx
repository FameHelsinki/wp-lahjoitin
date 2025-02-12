import React from 'react'
import { DEFAULT_DONATION_TYPE, DonationType } from '../common/DonationType.ts'
import { Control } from '../common/Types.ts'
import Radio from '../common/Radio.tsx'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'

type ContentProps = {
	/** Enabled types */
	types?: DonationType[]
	/** Default value */
	value?: string
}

type Props = ContentProps & {
	onChange: (types?: DonationType[]) => void
}

const Component: Control<Props, ContentProps> = ({
	types,
	value: defaultValue,
	onChange,
}) => (
	<>
		{types?.map(({ value, label }) => (
			<div key={value} className="donation-type__control">
				<Radio
					checked={value === defaultValue}
					className="donation-type__input"
				/>
				<RichText
					multiline={false}
					className="donation-type__label"
					aria-label={__('Donation type label', 'fame_lahjoitukset')}
					allowedFormats={[]}
					onChange={(label) =>
						onChange(
							types.map((type) =>
								type.value !== value ? type : { value, label }
							)
						)
					}
					placeholder={label}
					value={label}
				/>
			</div>
		))}
	</>
)

Component.Content = ({ types, value: defaultValue }) => {
	if (!Array.isArray(types) || types.length <= 1) {
		console.log('save 1', types, defaultValue)

		return (
			<input
				type="hidden"
				name="type"
				value={types?.[0]?.value ?? DEFAULT_DONATION_TYPE.value}
			/>
		)
	}

	console.log('save 2', types, defaultValue)

	return (
		<>
			{types.map(({ value, label }) => (
				<label
					key={value}
					htmlFor={`donation-type-${value}`}
					className="donation-type__label"
				>
					<input
						id={`donation-type-${value}`}
						className="donation-type__input"
						checked={value === defaultValue}
						type="radio"
						name="type"
						value={value}
					/>
					{label}
				</label>
			))}
		</>
	)
}

export default Component
