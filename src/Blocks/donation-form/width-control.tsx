import React from 'react'
import { BlockAlignmentToolbar, BlockControls, useSettings } from '@wordpress/block-editor'
import {
	Dropdown,
	RadioControl,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components'
import { __ } from '@wordpress/i18n'

export type WidthChoice = '' | 'content' | 'custom'
export type WidthAlignment = 'wide' | 'full'

export default function WidthControl({
	width,
	wideAlignment,
	customWidth,
	onChange,
	onAlignmentChange,
	onCustomWidthChange,
}: {
	width: WidthChoice
	wideAlignment: WidthAlignment | undefined
	customWidth: number
	onChange: (value: WidthChoice) => void
	onAlignmentChange: (value: WidthAlignment | undefined) => void
	onCustomWidthChange: (value: number) => void
}) {
	const [contentSize] = useSettings('layout.contentSize')
	const contentLabel = __('Content width', 'fame_lahjoitukset')
	const options = [
		{ value: '', label: __('Theme default', 'fame_lahjoitukset') },
		{
			value: 'content',
			label:
				typeof contentSize === 'string' && contentSize
					? `${contentLabel} (${contentSize})`
					: contentLabel,
		},
		{ value: 'custom', label: __('Custom width', 'fame_lahjoitukset') },
	]

	return (
		<BlockControls group="block">
			<ToolbarGroup>
				<Dropdown
					contentClassName="fame-form-width-control"
					popoverProps={{ placement: 'bottom-start' }}
					renderToggle={({ isOpen, onToggle }) => (
						<ToolbarButton onClick={onToggle} aria-expanded={isOpen}>
							{__('Width', 'fame_lahjoitukset')}
						</ToolbarButton>
					)}
					renderContent={() => (
						<div style={{ padding: 12, minWidth: 220 }}>
							<RadioControl
								label={__('Form width', 'fame_lahjoitukset')}
								selected={wideAlignment ? undefined : width}
								options={options}
								onChange={value => onChange(value as WidthChoice)}
							/>
							{/* Core hides this toolbar when neither alignment is available here. */}
							<BlockAlignmentToolbar
								controls={['wide', 'full']}
								isCollapsed={false}
								value={wideAlignment}
								onChange={value =>
									onAlignmentChange(
										value === 'wide' || value === 'full' ? value : undefined
									)
								}
							/>
							{!wideAlignment && width === 'custom' && (
								<TextControl
									label={__('Maximum width (px)', 'fame_lahjoitukset')}
									type="number"
									min={1}
									step={1}
									value={customWidth || ''}
									onChange={value => {
										const pixels = Number(value)
										if (Number.isSafeInteger(pixels) && pixels >= 0)
											onCustomWidthChange(pixels)
									}}
								/>
							)}
						</div>
					)}
				/>
			</ToolbarGroup>
		</BlockControls>
	)
}
