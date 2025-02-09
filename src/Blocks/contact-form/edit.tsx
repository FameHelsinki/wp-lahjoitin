/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n'

/**
 * Imports the InspectorControls component, which is used to wrap
 * the block's custom controls that will appear in in the Settings
 * Sidebar when the block is selected.
 *
 * Also imports the React hook that is used to mark the block wrapper
 * element. It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#inspectorcontrols
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor'

/**
 * Imports the necessary components that will be used to create
 * the user interface for the block's settings.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/
 */
import { PanelBody, ToggleControl } from '@wordpress/components'

/**
 * Imports the useEffect React Hook. This is used to set an attribute when the
 * block is loaded in the Editor.
 *
 * @see https://react.dev/reference/react/useEffect
 */
import React from 'react'
import ContactInputControl from './ContactInputControl.tsx'
import ContactInputGroup from './ContactInputGroup.tsx'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const { contact, showAddress, showPhone } = attributes

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Require contact', 'fame_lahjoitukset')}
						help={__(
							'Contact details are required if enabled',
							'fame_lahjoitukset'
						)}
						checked={contact}
						onChange={(contact) => setAttributes({ contact })}
					/>
					<ToggleControl
						label={__('Show address', 'fame_lahjoitukset')}
						help={__('Show address fields', 'fame_lahjoitukset')}
						checked={showAddress}
						onChange={(showAddress) =>
							setAttributes({ showAddress })
						}
					/>
					<ToggleControl
						label={__('Show phone', 'fame_lahjoitukset')}
						help={__(
							'Show phone number fields',
							'fame_lahjoitukset'
						)}
						checked={showPhone}
						onChange={(showPhone) => setAttributes({ showPhone })}
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
							controls={[
								{ name: 'city' },
								{ name: 'postal_code' },
							]}
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
