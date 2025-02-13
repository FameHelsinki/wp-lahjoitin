import React from 'react'
import { RichText } from '@wordpress/block-editor'
import { Control } from '../common/types.ts'
import { formatPlaceholder } from '../common/utils.ts'

export type Props = {
	name: string
	className?: string
	ariaDescribedBy?: string
	attributes: any
	required?: boolean
	setAttributes: (value: any) => void
}

export type ContentProps = Omit<Props, 'setAttributes'> & { type: string }

const ContactInputControl: Control<Props, ContentProps> = ({
	name,
	className,
	ariaDescribedBy,
	required,
	attributes,
	setAttributes,
}) => (
	<div className={className}>
		<RichText
			multiline={false}
			className={'contact-form__label' + (required ? ' contact-form__label--required' : '')}
			allowedFormats={['core/bold', 'core/italic']}
			onChange={value => setAttributes({ [`${name}_label`]: value })}
			value={attributes[`${name}_label`]}
			placeholder={`${formatPlaceholder(name)} label`}
		/>
		<div
			className="contact-form__input"
			id={`contact-${name}`}
			aria-describedby={ariaDescribedBy ? ariaDescribedBy : `contact-${name}-help`}
		></div>
		{!ariaDescribedBy && (
			<RichText
				id={`contact-${name}-help`}
				className="contact-form__help"
				multiline={false}
				allowedFormats={['core/bold', 'core/italic']}
				onChange={value => setAttributes({ [`${name}_help`]: value })}
				value={attributes[`${name}_help`]}
				placeholder={`${formatPlaceholder(name)} help`}
			/>
		)}
	</div>
)

ContactInputControl.Content = ({
	name,
	type,
	className,
	ariaDescribedBy,
	required,
	attributes,
}) => {
	const ariaDescribedById =
		ariaDescribedBy || (attributes[`${name}_help`] ? `contact-${name}-help` : undefined)

	return (
		<div className={className}>
			<RichText.Content
				htmlFor={`contact-${name}`}
				tagName="label"
				className={
					'contact-form__label' + (required ? ' contact-form__label--required' : '')
				}
				value={attributes[`${name}_label`]}
			/>
			<input
				type={type}
				name={name}
				required={required}
				className="contact-form__input"
				id={`contact-${name}`}
				aria-describedby={ariaDescribedById}
			/>
			{!ariaDescribedBy && attributes[`${name}_help`] && (
				<RichText.Content
					tagName="small"
					id={`contact-${name}-help`}
					className="contact-form__help"
					value={attributes[`${name}_help`]}
				/>
			)}
		</div>
	)
}

export default ContactInputControl
