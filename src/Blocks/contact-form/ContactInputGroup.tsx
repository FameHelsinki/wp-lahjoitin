import React from 'react'
import ContactInputControl, {
	Props as ContactInputProps,
	ContentProps as ContactInputContentProps,
} from './ContactInputControl.tsx'
import { RichText } from '@wordpress/block-editor'
import { Control } from '../common/types.ts'
import { formatPlaceholder } from '../common/utils.ts'

type ContactInput = Omit<ContactInputProps, 'setAttributes' | 'attributes'>
type ContactInputContent = Omit<ContactInputContentProps, 'attributes'>

type Props = {
	name: string
	className?: string
	controls: ContactInput[]
	attributes: any
	setAttributes: (value: any) => void
}

type ContentProps = Omit<Props, 'setAttributes' | 'controls'> & {
	controls: ContactInputContent[]
}

const ContactInputGroup: Control<Props, ContentProps> = ({
	name,
	className,
	controls,
	attributes,
	setAttributes,
}) => (
	<div className={className}>
		<div className="contact-form__group">
			{controls.map(props => (
				<ContactInputControl
					key={props.name}
					{...props}
					ariaDescribedBy={`contact-${name}-help`}
					attributes={attributes}
					setAttributes={setAttributes}
				/>
			))}
		</div>
		<RichText
			id={`contact-${name}-help`}
			className="contact-form__help"
			multiline={false}
			allowedFormats={['core/bold', 'core/italic']}
			onChange={help => setAttributes({ [`${name}_help`]: help })}
			value={attributes[`${name}_help`]}
			placeholder={`${formatPlaceholder(name)} help`}
		/>
	</div>
)

ContactInputGroup.Content = ({ name, className, controls, attributes }) => (
	<div className={className}>
		<div className="contact-form__group">
			{controls.map(props => (
				<ContactInputControl.Content
					key={props.name}
					{...props}
					ariaDescribedBy={`contact-${name}-help`}
					attributes={attributes}
				/>
			))}
		</div>
		{attributes[`${name}_help`] && (
			// Omit help text if help is empty.
			<RichText.Content
				tagName="small"
				id={`contact-${name}-help`}
				className="contact-form__help"
				value={attributes[`${name}_help`]}
			/>
		)}
	</div>
)

export default ContactInputGroup
