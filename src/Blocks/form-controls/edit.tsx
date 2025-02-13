import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { __ } from '@wordpress/i18n'
import { EditProps } from '../common/types.ts'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({ attributes, setAttributes }: EditProps): React.JSX.Element {
	const { submitLabel } = attributes

	return (
		<div {...useBlockProps({ className: 'donation-form__controls' })}>
			<RichText
				multiline={false}
				tagName="div"
				className="wp-element-button is-primary"
				aria-label={__('Submit button text', 'fame_lahjoitukset')}
				allowedFormats={[]}
				onChange={submitLabel => setAttributes({ submitLabel })}
				placeholder={__('Donate')}
				value={submitLabel}
			/>
		</div>
	)
}
