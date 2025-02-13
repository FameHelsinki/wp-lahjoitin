import React from 'react'
import { __ } from '@wordpress/i18n'
import { InspectorControls, useBlockProps } from '@wordpress/block-editor'
import { PanelBody, ToggleControl } from '@wordpress/components'
import ContactInputControl from './ContactInputControl.tsx'
import ContactInputGroup from './ContactInputGroup.tsx'
import { EditProps } from '../common/types.ts'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({ attributes, setAttributes }: EditProps): React.JSX.Element {
	const { contact, showAddress, showPhone } = attributes

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Require contact', 'fame_lahjoitukset')}
						help={__('Contact details are required if enabled', 'fame_lahjoitukset')}
						checked={contact}
						onChange={contact => setAttributes({ contact })}
					/>
					<ToggleControl
						label={__('Show address', 'fame_lahjoitukset')}
						help={__('Show address fields', 'fame_lahjoitukset')}
						checked={showAddress}
						onChange={showAddress => setAttributes({ showAddress })}
					/>
					<ToggleControl
						label={__('Show phone', 'fame_lahjoitukset')}
						help={__('Show phone number fields', 'fame_lahjoitukset')}
						checked={showPhone}
						onChange={showPhone => setAttributes({ showPhone })}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...useBlockProps({ className: 'contact-form' })}>
				<ContactInputGroup
					className="contact-form__row"
					name="name"
					controls={[
						{
							name: 'first_name',
							required: contact,
						},
						{
							name: 'last_name',
							required: contact,
						},
					]}
					attributes={attributes}
					setAttributes={setAttributes}
				/>
				<ContactInputControl
					className="contact-form__row"
					name="email"
					required={contact}
					attributes={attributes}
					setAttributes={setAttributes}
				/>
				{showAddress && (
					<>
						<ContactInputControl
							className="contact-form__row"
							name="address"
							attributes={attributes}
							setAttributes={setAttributes}
						/>
						<ContactInputGroup
							className="contact-form__row"
							name="city_postal_code"
							controls={[{ name: 'city' }, { name: 'postal_code' }]}
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					</>
				)}
				{showPhone && (
					<ContactInputControl
						className="contact-form__row"
						name="phone"
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				)}
			</div>
		</>
	)
}
