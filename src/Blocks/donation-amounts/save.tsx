import { useBlockProps } from '@wordpress/block-editor'
import Amounts from './Amounts'
import React from 'react'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @param root0
 * @param root0.attributes
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function save({ attributes }): React.JSX.Element {
	const { amounts, otherAmount, otherAmountLabel } = attributes

	return (
		<div {...useBlockProps.save({ className: 'donation-amounts' })}>
			<Amounts
				amounts={amounts}
				otherAmount={otherAmount}
				otherAmountLabel={otherAmountLabel}
				unit={'€'}
			/>
		</div>
	)
}
