import React, { FC } from 'react'
import { DONATION_TYPES } from '../common/DonationType.ts'

type Props = {
	types: string[]
}

const Component: FC<Props> = ({ types }) => (
	<div className="donation-type">
		{DONATION_TYPES.filter(({ value }) => types.includes(value)).map(
			({ value, label }) => (
				<label
					htmlFor={`donation-type-${value}`}
					className="donation-type__label"
					key={value}
				>
					<input
						id={`donation-type-${value}`}
						className="donation-type__input"
						checked={value === types[0]}
						type="radio"
						name="type"
						value={value}
					/>
					{label}
				</label>
			)
		)}
	</div>
)

export default Component
