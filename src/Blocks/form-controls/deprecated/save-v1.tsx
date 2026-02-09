import { __ } from '@wordpress/i18n'
import { RichText, useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../../common/types.ts'

type AttributesV1 = {
	submitLabel?: string
}

export default function SaveV1({
	attributes: { submitLabel = __('Donate', 'fame_lahjoitukset') },
}: SaveProps<AttributesV1>): React.JSX.Element {
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
