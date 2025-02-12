import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default ({ attributes: { submitLabel } }): React.JSX.Element => {
	return (
		<div {...useBlockProps.save({ className: 'donation-form__controls' })}>
			<RichText.Content
				type="submit"
				className="wp-element-button is-primary"
				tagName="button"
				value={submitLabel}
			/>
		</div>
	)
}
