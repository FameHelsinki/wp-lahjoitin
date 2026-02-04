import { __ } from '@wordpress/i18n'
import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor'
import {
	PanelBody,
	TextControl,
	ToggleControl,
	CheckboxControl,
	ColorPicker,
	BaseControl,
} from '@wordpress/components'
import React, { useEffect } from 'react'
import { DEFAULT_DONATION_TYPE, getDonationLabel, DONATION_TYPES } from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'
import { useInstanceId } from '@wordpress/compose'

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
		thirdColor,
		borderRadius,
		borderWidth,
		useModernStyle,
		textFieldBorderRadius,
	} = attributes as {
		types?: string[]
		returnAddress?: string
		campaign?: string
		primaryColor?: string
		secondaryColor?: string
		thirdColor?: string
		borderRadius?: string
		borderWidth?: string
		textFieldBorderRadius?: string
		token?: boolean
		useModernStyle?: boolean
	}

	// Having a type is always required. Set a default
	// value if the list is uninitialized or empty.
	useEffect(() => {
		if (!types || types.length === 0) {
			setAttributes({ types: [DEFAULT_DONATION_TYPE.value] })
		}
	}, [types, setAttributes])

	const allTypes = (DONATION_TYPES?.map(t => t.value) ?? ['single', 'recurring']) as string[]
	const order = allTypes

	type ThemeVars = Partial<
		Record<
			| '--primary-color'
			| '--secondary-color'
			| '--third-color'
			| '--border-radius'
			| '--border-width'
			| '--text-field-border-radius',
			string
		>
	>

	const styleVars: React.CSSProperties & ThemeVars = {
		'--primary-color': primaryColor ?? undefined,
		'--secondary-color': secondaryColor ?? undefined,
		'--third-color': thirdColor ?? undefined,
		'--border-radius': borderRadius ?? undefined,
		'--border-width': borderWidth ?? undefined,
		'--text-field-border-radius': textFieldBorderRadius ?? undefined,
	}

	const primaryColorId = useInstanceId(BaseControl, 'primary-color')
	const secondaryColorId = useInstanceId(BaseControl, 'secondary-color')
	const thirdColorId = useInstanceId(BaseControl, 'third-color')

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<div
						role="group"
						aria-label={__('Enabled donation types', 'fame_lahjoitukset')}
					>
						{allTypes.map(type => {
							const selected = new Set(types ?? [])
							const checked = selected.has(type)
							const canUncheck = selected.size > 1

							return (
								<CheckboxControl
									help={__(
										'Choose the donation type to enable.',
										'fame_lahjoitukset'
									)}
									key={type}
									label={getDonationLabel(type)}
									checked={checked}
									onChange={(nextChecked: boolean) => {
										let next = Array.from(selected)

										if (nextChecked) {
											if (!checked) next.push(type)
										} else {
											if (!canUncheck) return
											next = next.filter(t => t !== type)
										}
										next.sort((a, b) => order.indexOf(a) - order.indexOf(b))
										setAttributes({ types: next })
									}}
								/>
							)
						})}
					</div>

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
					<BaseControl
						id={primaryColorId}
						label={__('Primary color', 'fame_lahjoitukset')}
						help={__(
							'This is the background color for primary buttons.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPicker
							color={primaryColor || '#000000'}
							onChangeComplete={value =>
								setAttributes({ primaryColor: value?.hex || '' })
							}
							disableAlpha
						/>
					</BaseControl>
					<BaseControl
						id={secondaryColorId}
						label={__('Secondary Color', 'fame_lahjoitukset')}
						help={__('This is the text color for tabs.', 'fame_lahjoitukset')}
					>
						<ColorPicker
							color={secondaryColor || '#FFFFFF'}
							onChangeComplete={value =>
								setAttributes({ secondaryColor: value?.hex || '' })
							}
							disableAlpha
						/>
					</BaseControl>
					<BaseControl
						id={thirdColorId}
						label={__('Third Color', 'fame_lahjoitukset')}
						help={__('This is the text color for tabs.', 'fame_lahjoitukset')}
					>
						<ColorPicker
							color={thirdColor || '#444'}
							onChangeComplete={value =>
								setAttributes({ thirdColor: value?.hex || '' })
							}
							disableAlpha
						/>
					</BaseControl>
					<TextControl
						label={__('Border Radius', 'fame_lahjoitukset')}
						help={__('This is the border-radius for tabs.', 'fame_lahjoitukset')}
						value={borderRadius ?? ''}
						onChange={value => setAttributes({ borderRadius: value })}
					/>
					<TextControl
						label={__('Border Width', 'fame_lahjoitukset')}
						help={__(
							'This is the border-width for tabs and input fields.',
							'fame_lahjoitukset'
						)}
						value={borderWidth ?? ''}
						onChange={value => setAttributes({ borderWidth: value })}
					/>
					<TextControl
						label={__('Text field border radius', 'fame_lahjoitukset')}
						help={__(
							'This is the border-radius for the text fields.',
							'fame_lahjoitukset'
						)}
						value={textFieldBorderRadius ?? ''}
						onChange={value => setAttributes({ textFieldBorderRadius: value })}
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
						style: styleVars,
					}),
					{
						// prevents inserting or removing blocks,
						// but allows moving existing ones.
						template: TEMPLATE,
						allowedBlocks: ALLOWED_BLOCKS,
						templateLock: false,
					}
				)}
			/>
		</>
	)
}
