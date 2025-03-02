import { __ } from '@wordpress/i18n'
import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
const Save = ({ attributes: { submitLabel } }: SaveProps): React.JSX.Element => {
	// Submit button has disabled attribute by default.
	// The attribute is removed when JavaScript is loaded.
	return (
		<div {...useBlockProps.save({ className: 'fame-form__controls' })}>
			<RichText.Content
				disabled
				type="submit"
				className="wp-element-button is-primary"
				tagName="button"
				value={submitLabel}
			/>
			<noscript>
				{__('Please enable JavaScript to use this form.', 'fame_lahjoitukset')}
			</noscript>
		</div>
	)
}

export default Save
