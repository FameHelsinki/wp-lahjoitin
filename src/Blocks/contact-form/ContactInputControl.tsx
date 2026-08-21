import React, { FC } from 'react'
import { RichText } from '@wordpress/block-editor'
import { __ } from '@wordpress/i18n'
import { localizedDefault } from '../common/localized-default.ts'

export type Props = {
	name: string
	ariaDescribedBy?: string
	attributes: any
	required?: boolean
	setAttributes: (value: any) => void
}

export type ContentProps = Omit<Props, 'setAttributes'> & { type: string }

const contactLabels: Record<string, { legacy: string; translated: string }> = {
	first_name: { legacy: 'First name', translated: __('First name', 'fame_lahjoitukset') },
	last_name: { legacy: 'Last name', translated: __('Last name', 'fame_lahjoitukset') },
	email: { legacy: 'Email', translated: __('Email', 'fame_lahjoitukset') },
	address: { legacy: 'Address', translated: __('Address', 'fame_lahjoitukset') },
	city: { legacy: 'City', translated: __('City', 'fame_lahjoitukset') },
	postal_code: { legacy: 'Postal code', translated: __('Postal code', 'fame_lahjoitukset') },
	phone: { legacy: 'Phone', translated: __('Phone', 'fame_lahjoitukset') },
}

export function localizedContactLabel(name: string, value?: string): string {
	const fallback = contactLabels[name]
	return fallback ? localizedDefault(value, fallback.legacy, fallback.translated) : (value ?? '')
}

const ContactInputControl: FC<Props> = ({
	name,
	ariaDescribedBy,
	required,
	attributes,
	setAttributes,
}) => (
	<div className={'fame-form__group' + (required ? ' fame-form__group--required' : '')}>
		<RichText
			multiline={false}
			className="fame-form__label"
			allowedFormats={['core/bold', 'core/italic']}
			onChange={value => setAttributes({ [`${name}_label`]: value })}
			value={localizedContactLabel(name, attributes[`${name}_label`])}
			placeholder={contactLabels[name]?.translated ?? __('Label', 'fame_lahjoitukset')}
		/>
		<div
			className="fame-form__fake-input"
			id={`contact-${name}`}
			aria-describedby={ariaDescribedBy ? ariaDescribedBy : `contact-${name}-help`}
		></div>
		{!ariaDescribedBy && (
			<RichText
				id={`contact-${name}-help`}
				className="fame-form__help"
				multiline={false}
				allowedFormats={['core/bold', 'core/italic']}
				onChange={value => setAttributes({ [`${name}_help`]: value })}
				value={attributes[`${name}_help`]}
				placeholder={__('Help text', 'fame_lahjoitukset')}
			/>
		)}
	</div>
)

export const ContactInputContent: FC<ContentProps> = ({
	name,
	type,
	ariaDescribedBy,
	required,
	attributes,
}) => {
	const ariaDescribedById =
		ariaDescribedBy || (attributes[`${name}_help`] ? `contact-${name}-help` : undefined)

	return (
		<div className={'fame-form__group' + (required ? ' fame-form__group--required' : '')}>
			<RichText.Content
				htmlFor={`contact-${name}`}
				tagName="label"
				className="fame-form__label"
				value={localizedContactLabel(name, attributes[`${name}_label`])}
			/>
			<input
				type={type}
				name={name}
				required={required}
				className="fame-form__input"
				id={`contact-${name}`}
				aria-describedby={ariaDescribedById}
			/>
			{!ariaDescribedBy && attributes[`${name}_help`] && (
				<RichText.Content
					tagName="small"
					id={`contact-${name}-help`}
					className="fame-form__help"
					value={attributes[`${name}_help`]}
				/>
			)}
		</div>
	)
}

export default ContactInputControl
