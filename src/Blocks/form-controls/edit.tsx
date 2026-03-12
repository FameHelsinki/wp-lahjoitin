import React from 'react'
import { __ } from '@wordpress/i18n'
import { RichText, useBlockProps, InspectorControls } from '@wordpress/block-editor'
import { PanelBody, TextControl } from '@wordpress/components'
import { EditProps } from '../common/types.ts'
import { useCurrentDonationType } from '../common/donation-type.ts'

type DonationType = 'single' | 'recurring'
type DonationTypeOrUnknown = DonationType | undefined

type Attributes = {
	submitLabel?: string
	submitLabelSingle?: string
	submitLabelRecurring?: string
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({
	attributes,
	setAttributes,
	clientId,
}: EditProps<Attributes>): React.JSX.Element {
	const {
		submitLabel = __('Donate', 'fame_lahjoitukset'),
		submitLabelSingle,
		submitLabelRecurring,
	} = attributes

	const currentTypeRaw = useCurrentDonationType(clientId)
	const currentType: DonationTypeOrUnknown =
		currentTypeRaw === 'single' || currentTypeRaw === 'recurring' ? currentTypeRaw : undefined

	const getLabelForType = (type: DonationTypeOrUnknown) => {
		if (type === 'single') return submitLabelSingle ?? submitLabel
		if (type === 'recurring') return submitLabelRecurring ?? submitLabel
		return submitLabel
	}

	const setLabelForType = (type: DonationTypeOrUnknown, value: string) => {
		if (type === 'single') {
			setAttributes({ submitLabelSingle: value })
			return
		}
		if (type === 'recurring') {
			setAttributes({ submitLabelRecurring: value })
			return
		}
		setAttributes({ submitLabel: value })
	}

	const activeLabel = getLabelForType(currentType)

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Button labels', 'fame_lahjoitukset')}>
					<TextControl
						label={__('Single button text', 'fame_lahjoitukset')}
						value={submitLabelSingle ?? submitLabel}
						onChange={value => setAttributes({ submitLabelSingle: value })}
					/>
					<TextControl
						label={__('Recurring button text', 'fame_lahjoitukset')}
						value={submitLabelRecurring ?? submitLabel}
						onChange={value => setAttributes({ submitLabelRecurring: value })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps({ className: 'fame-form__controls' })}>
				<RichText
					multiline={false}
					tagName="button"
					className="wp-element-button is-primary"
					allowedFormats={[]}
					onChange={value => setLabelForType(currentType, value)}
					placeholder={__('Donate', 'fame_lahjoitukset')}
					value={activeLabel}
				/>
			</div>
		</>
	)
}
