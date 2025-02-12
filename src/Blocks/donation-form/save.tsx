import {
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor'
import React from 'react'
import {DEFAULT_DONATION_TYPE} from "../common/DonationType.ts"

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function save({ attributes }): React.JSX.Element {
	const { returnAddress, campaign, token, types, noTypeSelect } =
		attributes

	const blockProps = useBlockProps.save()
	const { children, ...innerBlockProps } = useInnerBlocksProps.save({
		className: 'donation-form__inner-blocks',
	})

	return (
		<div {...blockProps}>
			<form className="donation-form" data-token={token || undefined}>
				<div {...innerBlockProps}>
					{children as any}
					<input
						type="hidden"
						name="return_address"
						value={returnAddress || '/'}
					/>
					{campaign && (
						<input type="hidden" name="campaign" value={campaign} />
					)}
					{noTypeSelect && (
						<input type="hidden" name="type" value={types ? types[0] : DEFAULT_DONATION_TYPE.value} />
					)}
				</div>
			</form>
		</div>
	)
}
