import React, { FC } from 'react'
import { RichText } from '@wordpress/block-editor'
import { formatPlaceholder } from '../common/utils.ts'

export type Props = {
	name: string
	ariaDescribedBy?: string
	attributes: any
	required?: boolean
	setAttributes: (value: any) => void
}

export type ContentProps = Omit<Props, 'setAttributes'> & { type: string }

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
			value={attributes[`${name}_label`]}
			placeholder={`${formatPlaceholder(name)} label`}
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
				placeholder={`${formatPlaceholder(name)} help`}
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
				value={attributes[`${name}_label`]}
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
