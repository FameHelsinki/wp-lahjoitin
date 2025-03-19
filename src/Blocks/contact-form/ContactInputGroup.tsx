import React, { FC } from 'react'
import ContactInputControl, {
	ContactInputContent,
	Props as ContactInputProps,
	ContentProps as ContactInputContentProps,
} from './ContactInputControl.tsx'
import { RichText } from '@wordpress/block-editor'
import { formatPlaceholder } from '../common/utils.ts'

type ContactInput = Omit<ContactInputProps, 'setAttributes' | 'attributes'>
type ContactInputContent = Omit<ContactInputContentProps, 'attributes'>

type Props = {
	name: string
	controls: ContactInput[]
	attributes: any
	setAttributes: (value: any) => void
}

type ContentProps = Omit<Props, 'setAttributes' | 'controls'> & {
	controls: ContactInputContent[]
}

const ContactInputGroup: FC<Props> = ({ name, controls, attributes, setAttributes }) => (
	<div className="fame-form__row">
		{controls.map(props => (
			<ContactInputControl
				key={props.name}
				{...props}
				ariaDescribedBy={`contact-${name}-help`}
				attributes={attributes}
				setAttributes={setAttributes}
			/>
		))}
		<RichText
			id={`contact-${name}-help`}
			className="fame-form__help"
			multiline={false}
			allowedFormats={['core/bold', 'core/italic']}
			onChange={help => setAttributes({ [`${name}_help`]: help })}
			value={attributes[`${name}_help`]}
			placeholder={`${formatPlaceholder(name)} help`}
		/>
	</div>
)

export const ContactGroupContent: FC<ContentProps> = ({ name, controls, attributes }) => (
	<div className="fame-form__row">
		{controls.map(props => (
			<ContactInputContent
				key={props.name}
				{...props}
				ariaDescribedBy={`contact-${name}-help`}
				attributes={attributes}
			/>
		))}
		{attributes[`${name}_help`] && (
			// Omit help text if help is empty.
			<RichText.Content
				tagName="small"
				id={`contact-${name}-help`}
				className="fame-form__help"
				value={attributes[`${name}_help`]}
			/>
		)}
	</div>
)

export default ContactInputGroup
