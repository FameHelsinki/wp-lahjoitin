import { __ } from '@wordpress/i18n'
import { useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'

type Attributes = {
	submitLabel?: string // legacy
	submitLabelSingle?: string
	submitLabelRecurring?: string
}

const Save = ({
	attributes: {
		submitLabel = __('Donate', 'fame_lahjoitukset'),
		submitLabelSingle,
		submitLabelRecurring,
	},
}: SaveProps<Attributes>): React.JSX.Element => {
	// What text should be placed directly inside the button?
	// if single/recurring same -> ok
	// otherwise use legacy and give data attributes to JS for replacement
	const resolved =
		submitLabelSingle && submitLabelRecurring && submitLabelSingle === submitLabelRecurring
			? submitLabelSingle
			: submitLabel

	return (
		<div {...useBlockProps.save({ className: 'fame-form__controls' })}>
			<button
				disabled
				type="submit"
				className="wp-element-button is-primary"
				data-label-single={submitLabelSingle ?? submitLabel}
				data-label-recurring={submitLabelRecurring ?? submitLabel}
			>
				{resolved}
			</button>

			<noscript>
				{__('Please enable JavaScript to use this form.', 'fame_lahjoitukset')}
			</noscript>
		</div>
	)
}

export default Save
