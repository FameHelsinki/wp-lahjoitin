import { useBlockProps } from '@wordpress/block-editor'
import { DONATION_TYPES } from '../common/DonationType.ts'
import React, { useEffect } from 'react'
import Radio from '../common/Radio.tsx'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({ context, setAttributes }): React.JSX.Element {
	const { 'famehelsinki/donation-form/types': types } = context

	useEffect(() => {
		setAttributes({ types })
	}, [types, setAttributes])

	return (
		<div {...useBlockProps({ className: 'donation-type' })}>
			{DONATION_TYPES.filter((type) => types.includes(type.value)).map(
				({ value, label }) => (
					<div key={value} className="donation-type__label">
						<Radio
							checked={value === types[0]}
							className="donation-type__input"
						/>
						{label}
					</div>
				)
			)}
		</div>
	)
}
