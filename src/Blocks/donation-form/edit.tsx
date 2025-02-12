import { __ } from '@wordpress/i18n'
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	RichText,
} from '@wordpress/block-editor'
import {
	PanelBody,
	SelectControl,
	RadioControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components'
import React, { useEffect } from 'react'
import {
	DONATION_TYPES,
	DEFAULT_DONATION_TYPE,
} from '../common/DonationType.ts'
import { useHasBlockType } from '../common/useHasBlockType.ts'
import { formatAmount } from '../common/utils.ts'

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 */
export default function Edit({
	attributes,
	setAttributes,
	clientId,
}): React.JSX.Element {
	const {
		types = [],
		defaultAmount,
		submitLabel,
		returnAddress,
		campaign,
		token,
	} = attributes

	// End-user can select donation type if donation type block is enabled.
	const canSelectType = useHasBlockType(
		clientId,
		'famehelsinki/donation-type'
	)

	useEffect(() => {
		// This is inverted so it works nicer
		// with Gutenberg boolean attribute query.
		setAttributes({ noTypeSelect: !canSelectType })

		// Types attribute supports multiple values
		// only when types component is present.
		if (!canSelectType && types?.length > 1) {
			setAttributes({
				types: types.slice(0, 1),
			})
		}
		// Having a type is always required. Set a default
		// value if the list is uninitialized or empty.
		else if (!types) {
			setAttributes({ types: [DEFAULT_DONATION_TYPE.value] })
		}
	}, [types, canSelectType, setAttributes])

	const { children, ...innerBlockProps } = useInnerBlocksProps({
		className: 'donation-form__inner-blocks',
	})

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					{canSelectType && (
						// @todo would be nice to find a way to
						//       put this in type select component.
						<SelectControl
							multiple={true}
							label={__(
								'Enabled donation types',
								'fame_lahjoitukset'
							)}
							help={__(
								'Donation types that can be used with this form. Selecting multiple options is allowed.',
								'fame_lahjoitukset'
							)}
							value={types}
							options={DONATION_TYPES}
							onChange={(types: string[]) =>
								setAttributes({ types })
							}
						/>
					)}
					<RadioControl
						label={__('Default donation type', 'fame_lahjoitukset')}
						help={__(
							'Use donation type component for more customization',
							'fame_lahjoitukset'
						)}
						selected={types[0]}
						options={
							canSelectType
								? DONATION_TYPES.filter((item) =>
										types.includes(item.value)
									)
								: DONATION_TYPES
						}
						onChange={(value) => {
							// Default type is encoded into the
							// order of the types array.
							setAttributes({
								types: [
									value,
									...types.filter(
										(item: string) => item !== value
									),
								],
							})
						}}
					/>
					<TextControl
						label={__('Default amount', 'fame_lahjoitukset')}
						help={__(
							'Default donation amount.',
							'fame_lahjoitukset'
						)}
						value={defaultAmount}
						onChange={(value) =>
							setAttributes({
								defaultAmount: formatAmount(value),
							})
						}
					/>
					<TextControl
						label={__('Return address', 'fame_lahjoitukset')}
						help={__(
							'Page that is displayed after donation is submitted.',
							'fame_lahjoitukset'
						)}
						value={returnAddress}
						onChange={(returnAddress) =>
							setAttributes({ returnAddress })
						}
					/>
					<TextControl
						label={__('Campaign', 'fame_lahjoitukset')}
						help={__(
							'Label that can be used to segment donations coming from this form.',
							'fame_lahjoitukset'
						)}
						value={campaign}
						onChange={(campaign) => setAttributes({ campaign })}
					/>
					<ToggleControl
						label={__('Return userinfo token', 'fame_lahjoitukset')}
						help={__(
							'This option includes userinfo token in the return address. This is not generally useful and requires custom logic to handle the token.',
							'fame_lahjoitukset'
						)}
						checked={token}
						onChange={(token) => setAttributes({ token })}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...useBlockProps()}>
				<div {...innerBlockProps}>
					{children as any}
					<div className="donation-form__controls">
						<div className="wp-element-button is-primary">
							<RichText
								multiline={false}
								tagName="span"
								aria-label={__(
									'Submit button text',
									'fame_lahjoitukset'
								)}
								allowedFormats={['core/bold', 'core/italic']}
								onChange={(submitLabel) =>
									setAttributes({ submitLabel })
								}
								placeholder={__('Donate')}
								value={submitLabel}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
