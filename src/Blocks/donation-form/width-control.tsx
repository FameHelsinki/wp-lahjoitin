import React from 'react'
import { BlockControls, store as blockEditorStore, useSettings } from '@wordpress/block-editor'
import {
	Dropdown,
	RadioControl,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components'
import { useSelect } from '@wordpress/data'
import { __ } from '@wordpress/i18n'

export type WidthChoice = '' | 'content' | 'wide' | 'full' | 'custom'

type WidthAlignment = 'wide' | 'full'

export type ParentLayout = {
	type?: string
	alignments?: string[]
	contentSize?: string
	wideSize?: string
}

type LayoutSettings = {
	alignWide?: boolean
	supportsLayout?: boolean
	__unstableIsBlockBasedTheme?: boolean
}

function supportsWidth(alignment: WidthAlignment, layout: ParentLayout, settings: LayoutSettings) {
	const { type = 'default', alignments, contentSize, wideSize } = layout
	// Match the editor's wide/full options for flow, constrained, flex and grid layouts.
	if (type !== 'default' && type !== 'constrained') return false
	if (alignments) return alignments.includes(alignment)
	if (!settings.supportsLayout) return !!settings.alignWide
	if (type === 'default' && settings.__unstableIsBlockBasedTheme) return false
	return Boolean(alignment === 'wide' ? wideSize : contentSize)
}

function widthLabel(label: string, size: unknown): string {
	return typeof size === 'string' && size ? `${label} (${size})` : label
}

export default function WidthControl({
	width,
	parentLayout = {},
	customWidth,
	onChange,
	onCustomWidthChange,
}: {
	width: WidthChoice
	parentLayout?: ParentLayout
	customWidth: number
	onChange: (value: WidthChoice) => void
	onCustomWidthChange: (value: number) => void
}) {
	const [contentSize, wideSize] = useSettings('layout.contentSize', 'layout.wideSize')
	const settings: LayoutSettings = useSelect(select => select(blockEditorStore).getSettings(), [])
	const options = [
		{ value: '', label: __('Theme default', 'fame_lahjoitukset') },
		{
			value: 'content',
			label: widthLabel(__('Content width', 'fame_lahjoitukset'), contentSize),
		},
	]
	if (supportsWidth('wide', parentLayout, settings)) {
		options.push({
			value: 'wide',
			label: widthLabel(__('Wide width'), parentLayout.wideSize ?? wideSize),
		})
	}
	if (supportsWidth('full', parentLayout, settings)) {
		options.push({ value: 'full', label: __('Full width') })
	}
	options.push({ value: 'custom', label: __('Custom width', 'fame_lahjoitukset') })

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
								selected={width}
								options={options}
								onChange={value => onChange(value as WidthChoice)}
							/>
							{width === 'custom' && (
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
