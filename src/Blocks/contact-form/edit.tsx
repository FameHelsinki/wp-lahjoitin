import React from 'react'
import { __ } from '@wordpress/i18n'
import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor'
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components'
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
	const { contact, showAddress, showPhone, showLegend, legend } = attributes

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
					<ToggleControl
						label={__('Show legend', 'fame_lahjoitukset')}
						checked={showLegend}
						onChange={checked => setAttributes({ showLegend: checked })}
					/>
					<TextControl
						label={__('Legend', 'fame_lahjoitukset')}
						value={legend}
						onChange={value => setAttributes({ legend: value })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps({ className: 'contact-form' })}>
				{showLegend && (
					<RichText
						multiline={false}
						className="fame-form__legend"
						aria-label={__('Legend', 'fame_lahjoitukset')}
						placeholder={__('Amount', 'fame_lahjoitukset')}
						allowedFormats={[]}
						value={legend}
						onChange={value => setAttributes({ legend: value })}
					/>
				)}
				<ContactInputGroup
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
					name="email"
					required={contact}
					attributes={attributes}
					setAttributes={setAttributes}
				/>
				{showAddress && (
					<>
						<ContactInputControl
							name="address"
							attributes={attributes}
							setAttributes={setAttributes}
						/>
						<ContactInputGroup
							name="city_postal_code"
							controls={[{ name: 'city' }, { name: 'postal_code' }]}
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					</>
				)}
				{showPhone && (
					<ContactInputControl
						name="phone"
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				)}
			</div>
		</>
	)
}
