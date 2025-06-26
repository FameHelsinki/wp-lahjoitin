import { __ } from '@wordpress/i18n'
import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor'
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components'
import React, { useEffect } from 'react'
import { DEFAULT_DONATION_TYPE } from '../common/donation-type.ts'
import TypeControl from './TypeControl.tsx'
import { EditProps } from '../common/types.ts'

const TEMPLATE_LOCK = { lock: { remove: 'true' } }
const TEMPLATE = [
	'famehelsinki/donation-type',
	'famehelsinki/donation-amounts',
	'famehelsinki/donation-providers',
	'famehelsinki/form-controls',
].map(block => [block, TEMPLATE_LOCK, []] as const)

const ALLOWED_BLOCKS = ['core/group', 'core/paragraph']

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({ attributes, setAttributes }: EditProps): React.JSX.Element {
	const {
		types,
		returnAddress,
		campaign,
		token,
		primaryColor,
		secondaryColor,
		borderRadius,
		useModernStyle,
	} = attributes as {
		types?: string[]
		returnAddress?: string
		campaign?: string
		primaryColor?: string
		secondaryColor?: string
		borderRadius?: string
		token?: boolean
		useModernStyle?: boolean
	}

	// Having a type is always required. Set a default
	// value if the list is uninitialized or empty.
	useEffect(() => {
		if (!types) {
			setAttributes({ types: [DEFAULT_DONATION_TYPE.value] })
		}
	}, [types, setAttributes])

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<TypeControl types={types} onChange={types => setAttributes({ types })} />
					<TextControl
						label={__('Return address', 'fame_lahjoitukset')}
						help={__(
							'Page that is displayed after donation is submitted.',
							'fame_lahjoitukset'
						)}
						value={returnAddress ?? ''}
						onChange={returnAddress => setAttributes({ returnAddress })}
					/>
					<TextControl
						label={__('Campaign', 'fame_lahjoitukset')}
						help={__(
							'Label that can be used to segment donations coming from this form.',
							'fame_lahjoitukset'
						)}
						value={campaign ?? ''}
						onChange={campaign => setAttributes({ campaign })}
					/>
					<TextControl
						label={__('Primary Color', 'fame_lahjoitukset')}
						help={__(
							'This is the background color for primary buttons.',
							'fame_lahjoitukset'
						)}
						value={primaryColor ?? ''}
						onChange={value => setAttributes({ primaryColor: value })}
					/>
					<TextControl
						label={__('Secondary Color', 'fame_lahjoitukset')}
						help={__(
							'This is the text color for primary buttons.',
							'fame_lahjoitukset'
						)}
						value={secondaryColor ?? ''}
						onChange={value => setAttributes({ secondaryColor: value })}
					/>
					<TextControl
						label={__('Border Radius', 'fame_lahjoitukset')}
						help={__(
							'This is the border-radius for primary buttons.',
							'fame_lahjoitukset'
						)}
						value={borderRadius ?? ''}
						onChange={value => setAttributes({ borderRadius: value })}
					/>
					<ToggleControl
						label={__('Use modern style', 'fame_lahjoitukset')}
						help={__('Toggle modern style wrapper class.', 'fame_lahjoitukset')}
						checked={useModernStyle}
						onChange={value => setAttributes({ useModernStyle: value })}
					/>
					<ToggleControl
						label={__('Return userinfo token', 'fame_lahjoitukset')}
						help={__(
							'This option includes userinfo token in the return address. This is not generally useful and requires custom logic to handle the token.',
							'fame_lahjoitukset'
						)}
						checked={token}
						onChange={token => setAttributes({ token })}
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{...useInnerBlocksProps(
					useBlockProps({
						className: `fame-form__wrapper ${useModernStyle ? 'has-modern-style' : ''}`,
					}),
					{
						// prevents inserting or removing blocks,
						// but allows moving existing ones.
						template: TEMPLATE,
						allowedBlocks: ALLOWED_BLOCKS, // SALLII VAIN GROUPIN
						templateLock: false,
					}
				)}
			/>
		</>
	)
}
