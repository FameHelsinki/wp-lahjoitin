import { useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import DonationTypes from './DonationTypes'
import { DonationType } from '../common/DonationType.ts'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default ({ attributes }): React.JSX.Element => {
	const { types, value } = attributes as {
		types?: DonationType[]
		value?: string
	}

	return (
		<div {...useBlockProps.save({ className: 'donation-type' })}>
			<DonationTypes.Content types={types} value={value} />
		</div>
	)
}
