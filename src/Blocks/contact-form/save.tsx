import { useBlockProps } from '@wordpress/block-editor'
import React from 'react'
import ContactInputGroup from './ContactInputGroup.tsx'
import ContactInputControl from './ContactInputControl.tsx'
import { SaveProps } from '../common/types.ts'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @param root0
 * @param root0.attributes
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function save({ attributes }: SaveProps): React.JSX.Element {
	const { contact, showAddress, showPhone } = attributes

	return (
		<div
			{...useBlockProps.save({ className: 'contact-form' })}
			data-contact={contact || undefined}
		>
			<ContactInputGroup.Content
				className="contact-form__row"
				name="name"
				controls={[
					{
						name: 'first_name',
						required: contact,
						type: 'text',
					},
					{
						name: 'last_name',
						required: contact,
						type: 'text',
					},
				]}
				attributes={attributes}
			/>
			<ContactInputControl.Content
				className="contact-form__row"
				name="email"
				type="email"
				required={contact}
				attributes={attributes}
			/>
			{showAddress && (
				<>
					<ContactInputControl.Content
						className="contact-form__row"
						name="address"
						type="text"
						attributes={attributes}
					/>
					<ContactInputGroup.Content
						className="contact-form__row"
						name="city_postal_code"
						controls={[
							{ name: 'city', type: 'text' },
							{ name: 'postal_code', type: 'text' },
						]}
						attributes={attributes}
					/>
				</>
			)}
			{showPhone && (
				<ContactInputControl.Content
					className="contact-form__row"
					name="phone"
					type="tel"
					attributes={attributes}
				/>
			)}
		</div>
	)
}
