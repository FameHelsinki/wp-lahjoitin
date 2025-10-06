import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor'
import React from 'react'
import { SaveProps } from '../common/types.ts'

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 */
export default function save({ attributes }: SaveProps): React.JSX.Element {
	const {
		returnAddress,
		campaign,
		token,
		primaryColor,
		secondaryColor,
		borderRadius,
		borderWidth,
		useModernStyle,
	} = attributes

	const blockProps = useBlockProps.save({
		className: `fame-form-container ${useModernStyle ? 'has-modern-style' : ''}`,
	})
	const innerBlockProps = useInnerBlocksProps.save({
		className: 'fame-form__wrapper',
		style: {
			'--primary-color': primaryColor || 'inherit',
			'--secondary-color': secondaryColor || 'inherit',
			'--border-radius': borderRadius || 'inherit',
			'--border-width': borderWidth || 'inherit',
		},
	})

	return (
		<div {...blockProps}>
			<form
				className="fame-form fame-form--donations"
				data-token={token || undefined}
				noValidate
			>
				<div {...innerBlockProps} />

				<input type="hidden" name="return_address" value={returnAddress || '/'} />

				<input type="hidden" name="provider" data-selected-provider />

				{campaign && <input type="hidden" name="campaign" value={campaign} />}
			</form>
			<div className="fame-form-overlay">
				<div className="fame-form-spinner" role="status">
					<span className="screen-reader-text">Loading</span>
				</div>
			</div>
		</div>
	)
}
