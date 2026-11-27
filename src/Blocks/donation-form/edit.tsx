import React, { useEffect, useRef, useState } from 'react'
import { __, sprintf } from '@wordpress/i18n'
import {
	BlockContextProvider,
	InspectorControls,
	ColorPalette,
	InnerBlocks,
	useBlockProps,
	useSettings,
	store as blockEditorStore,
} from '@wordpress/block-editor'
import {
	PanelBody,
	TextControl,
	BaseControl,
	SelectControl,
	Notice,
	Button,
} from '@wordpress/components'
import { useInstanceId } from '@wordpress/compose'
import { useDispatch, useSelect, useRegistry } from '@wordpress/data'
import { getBlockType, type Block as BlockInstance } from '@wordpress/blocks'
import {
	createInitialLayout,
	prepareLayout,
	LAYOUT_VERSION,
	missingSections,
	restoreSections,
} from './layout'

import { invalidContent } from './content-validation'
import { fieldProblem } from '../custom-data-field/fields'
import { useFieldKeyConflicts } from '../custom-data-field/field-key-conflicts'
import { colorValue, cssLength } from './style-values'
import { legendFontWeights } from './legend-font-weights'
import WidthControl, { type ParentLayout, type WidthChoice } from './width-control'
import FormInserter from './form-inserter'

import { EditProps } from '../common/types.ts'

const TOP_ALLOWED_BLOCKS = ['core/columns'] as const

export default function Edit({
	attributes,
	setAttributes,
	clientId,
	__unstableParentLayout: parentLayout,
}: EditProps & { __unstableParentLayout?: ParentLayout }): React.JSX.Element {
	const {
		returnAddress,
		align,
		formWidth,
		formMaxWidth,
		primaryColor,
		secondaryColor,
		buttonBorderColor,
		thirdColor,
		borderRadius,
		borderWidth,
		textFieldBorderRadius,
		colsDesktop,
		dangerColor,
		sectionLabelColor,
		sectionLabelFontSize,
		sectionLabelFontWeight,
	} = attributes as {
		returnAddress?: string
		align?: string
		formWidth?: '' | 'content' | 'custom'
		formMaxWidth?: number
		primaryColor?: string
		secondaryColor?: string
		buttonBorderColor?: string
		thirdColor?: string
		borderRadius?: string
		borderWidth?: string
		textFieldBorderRadius?: string
		colsDesktop?: number
		dangerColor?: string
		sectionLabelColor?: string
		sectionLabelFontSize?: string
		sectionLabelFontWeight?: string
	}

	const [fontFamilies] = useSettings('typography.fontFamilies')
	const wrapperRef = useRef<HTMLDivElement>(null)
	const [fontFamily, setFontFamily] = useState('')
	// Wait for iframe styles/fonts and observe ancestor typography changes.
	useEffect(() => {
		const element = wrapperRef.current
		const view = element?.ownerDocument.defaultView
		if (!element || !view) return
		let active = true
		let frame = 0
		const update = () => {
			if (!active || frame) return
			frame = view.requestAnimationFrame(() => {
				frame = 0
				const legend = element.querySelector('.fame-form__legend') ?? element
				if (active) setFontFamily(view.getComputedStyle(legend).fontFamily)
			})
		}
		update()
		void element.ownerDocument.fonts?.ready.then(update)
		const observer = new view.MutationObserver(update)
		observer.observe(element, { childList: true, subtree: true })
		let ancestor: HTMLElement | null = element
		while (ancestor) {
			observer.observe(ancestor, { attributes: true, attributeFilter: ['class', 'style'] })
			ancestor = ancestor.parentElement
		}
		element.ownerDocument.addEventListener('load', update, true)
		return () => {
			active = false
			view.cancelAnimationFrame(frame)
			observer.disconnect()
			element.ownerDocument.removeEventListener('load', update, true)
		}
	}, [fontFamilies])

	const fontWeights = legendFontWeights(fontFamilies, fontFamily)
	const fontWeightOptions = [
		{ label: __('Theme default', 'fame_lahjoitukset'), value: '' },
		...fontWeights.map(value => ({ label: value, value })),
	]
	// Keep a saved selection visible when switching themes; it can be reset.
	if (sectionLabelFontWeight && !fontWeights.includes(sectionLabelFontWeight)) {
		fontWeightOptions.push({
			label: `${sectionLabelFontWeight} (${__('saved value', 'fame_lahjoitukset')})`,
			value: sectionLabelFontWeight,
		})
	}

	const cols = Math.min(3, Math.max(1, colsDesktop ?? 1)) as 1 | 2 | 3
	const wideAlignment = align === 'wide' || align === 'full' ? align : undefined
	const width = formWidth ?? ''
	const customWidth = formMaxWidth ?? 0
	let widthLimit: string | undefined
	if (!wideAlignment && width === 'content') {
		widthLimit = 'var(--wp--style--global--content-size, 100%)'
	}
	if (
		!wideAlignment &&
		width === 'custom' &&
		Number.isSafeInteger(customWidth) &&
		customWidth > 0
	) {
		widthLimit = `${customWidth}px`
	}

	const changeWidth = (choice: WidthChoice) => {
		if (choice === 'wide' || choice === 'full') {
			setAttributes({ align: choice })
			return
		}
		setAttributes({
			formWidth: choice,
			align: wideAlignment ? '' : align,
		})
	}

	type ThemeVars = Partial<
		Record<
			| '--primary-color'
			| '--secondary-color'
			| '--button-border-color'
			| '--third-color'
			| '--border-radius'
			| '--border-width'
			| '--text-field-border-radius'
			| '--fame-clr-danger'
			| '--section-label-color'
			| '--section-label-font-size'
			| '--section-label-font-weight'
			| '--fame-form-max-width',
			string
		>
	>

	const styleVars: React.CSSProperties & ThemeVars = {
		'--primary-color': colorValue(primaryColor, '#000000'),
		'--secondary-color': colorValue(secondaryColor, '#FFFFFF'),
		'--button-border-color': colorValue(buttonBorderColor, colorValue(primaryColor, '#000000')),
		'--third-color': colorValue(thirdColor, '#444'),
		'--border-radius': cssLength(borderRadius, '0px'),
		'--border-width': cssLength(borderWidth, '1px'),
		'--text-field-border-radius': cssLength(textFieldBorderRadius, '0px'),
		'--fame-clr-danger': colorValue(dangerColor, '#dc3545'),
		'--section-label-color': colorValue(sectionLabelColor, 'inherit'),
		'--section-label-font-size': cssLength(sectionLabelFontSize, '1.25em'),
		'--section-label-font-weight': sectionLabelFontWeight || undefined,
		'--fame-form-max-width': widthLimit,
		// The editor applies its own content width to the block wrapper.
		width: widthLimit ? '100%' : undefined,
		maxWidth: widthLimit ? 'min(100%, var(--fame-form-max-width))' : undefined,
	}

	const primaryColorId = useInstanceId(BaseControl, 'primary-color')
	const secondaryColorId = useInstanceId(BaseControl, 'secondary-color')
	const buttonBorderColorId = useInstanceId(BaseControl, 'button-border-color')
	const thirdColorId = useInstanceId(BaseControl, 'third-color')
	const dangerColorId = useInstanceId(BaseControl, 'fame-clr-danger')
	const sectionLabelColorId = useInstanceId(BaseControl, 'section-label-color')

	const { innerBlocks, editorBlockIds, showEditorHelp } = useSelect(
		select => {
			const editor = select(blockEditorStore)
			return {
				innerBlocks: editor.getBlocks(clientId) as BlockInstance[],
				editorBlockIds: editor.getClientIdsWithDescendants(),
				showEditorHelp:
					editor.isBlockSelected(clientId) ||
					editor.hasSelectedInnerBlock(clientId, true),
			}
		},
		[clientId]
	)
	const invalidBlocks = invalidContent(innerBlocks)
	const invalidKey = invalidBlocks.join(',')
	const { fields, duplicateKeys, fieldContext } = useFieldKeyConflicts(
		clientId,
		innerBlocks,
		editorBlockIds
	)
	const misconfiguredFields = fields.flatMap(field => {
		const problem = fieldProblem(field.attributes)
		return problem ? [{ ...field, problem }] : []
	})
	const hasMisconfiguredFields = misconfiguredFields.length > 0 || duplicateKeys.length > 0
	const blockActions = useDispatch(blockEditorStore)
	const { replaceInnerBlocks } = blockActions
	const { __unstableMarkNextChangeAsNotPersistent } = blockActions as unknown as {
		__unstableMarkNextChangeAsNotPersistent: () => void
	}
	const registry = useRegistry()
	const initialized = useRef(false)
	const missing = missingSections(innerBlocks)
	const missingKey = missing.join(',')

	// Migration is a one-time, non-undoable normalization, not an effect that
	// rewrites every restored undo state or overrides user block locks.
	useEffect(() => {
		if (initialized.current) return
		initialized.current = true
		const version = attributes.layoutVersion ?? 0
		if (version >= LAYOUT_VERSION) return
		const top = innerBlocks[0]
		let next: BlockInstance[] | null = null
		if (innerBlocks.length === 0) next = createInitialLayout(cols)
		else if (innerBlocks.length === 1 && top.name === 'core/columns') {
			next = [prepareLayout(top, version < 1)]
		}
		if (!next) return
		const treeChanged =
			next.length !== innerBlocks.length ||
			next.some((item, index) => item !== innerBlocks[index])
		registry.batch(() => {
			if (treeChanged) {
				__unstableMarkNextChangeAsNotPersistent()
				replaceInnerBlocks(clientId, next, false)
			}
			__unstableMarkNextChangeAsNotPersistent()
			setAttributes({ layoutVersion: LAYOUT_VERSION })
		})
	}, [
		attributes.layoutVersion,
		clientId,
		cols,
		innerBlocks,
		registry,
		replaceInnerBlocks,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	])

	useEffect(() => {
		// Widgets and other block editors do not necessarily register core/editor.
		const actions = registry.dispatch('core/editor') as
			| {
					lockPostSaving?: (key: string) => void
					unlockPostSaving?: (key: string) => void
			  }
			| undefined
		const key = `lahjoitin-incomplete-${clientId}`
		if (missingKey || invalidKey || hasMisconfiguredFields) actions?.lockPostSaving?.(key)
		else actions?.unlockPostSaving?.(key)
		return () => actions?.unlockPostSaving?.(key)
	}, [clientId, missingKey, invalidKey, hasMisconfiguredFields, registry])

	return (
		<>
			<WidthControl
				width={wideAlignment ?? width}
				parentLayout={parentLayout}
				customWidth={customWidth}
				onChange={changeWidth}
				onCustomWidthChange={value => setAttributes({ formMaxWidth: value })}
			/>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<TextControl
						label={__('Return address', 'fame_lahjoitukset')}
						help={__(
							'Page that is displayed after donation is submitted.',
							'fame_lahjoitukset'
						)}
						value={returnAddress ?? ''}
						onChange={newReturnAddress =>
							setAttributes({ returnAddress: newReturnAddress })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<InspectorControls group="styles">
				<PanelBody title={__('Styles', 'fame_lahjoitukset')}>
					<BaseControl
						id={primaryColorId}
						label={__('Selected button background color', 'fame_lahjoitukset')}
						help={__(
							'This is the background color for selected buttons.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={colorValue(primaryColor, '#000000')}
							onChange={value => setAttributes({ primaryColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<BaseControl
						id={buttonBorderColorId}
						label={__('Button border color', 'fame_lahjoitukset')}
						help={__(
							'This is the border color for selected and unselected donation type and amount buttons.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={colorValue(
								buttonBorderColor,
								colorValue(primaryColor, '#000000')
							)}
							onChange={value => setAttributes({ buttonBorderColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<BaseControl
						id={secondaryColorId}
						label={__('Selected button text color', 'fame_lahjoitukset')}
						help={__(
							'This is the text color for selected buttons.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={colorValue(secondaryColor, '#FFFFFF')}
							onChange={value => setAttributes({ secondaryColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<BaseControl
						id={thirdColorId}
						label={__('Input border color', 'fame_lahjoitukset')}
						help={__(
							'This defines the border and helper text color of the input field.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={colorValue(thirdColor, '#444')}
							onChange={value => setAttributes({ thirdColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<BaseControl
						id={sectionLabelColorId}
						label={__('Section label color', 'fame_lahjoitukset')}
						help={__(
							'This color is used for all form section legends.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={
								sectionLabelColor
									? colorValue(sectionLabelColor, 'inherit')
									: undefined
							}
							onChange={value => setAttributes({ sectionLabelColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<SelectControl
						label={__('Section label font weight', 'fame_lahjoitukset')}
						value={sectionLabelFontWeight ?? ''}
						options={fontWeightOptions}
						onChange={value => setAttributes({ sectionLabelFontWeight: value })}
						help={
							fontWeights.length === 0
								? __(
										'The theme does not declare font weights for the current font.',
										'fame_lahjoitukset'
									)
								: __(
										'Available weights come from the theme font definitions. Applies only to section labels.',
										'fame_lahjoitukset'
									)
						}
					/>

					<TextControl
						label={__('Section label font size', 'fame_lahjoitukset')}
						help={__(
							'Used for all form section legends. For example: 1.25em, 20px or 1.5rem.',
							'fame_lahjoitukset'
						)}
						value={sectionLabelFontSize ?? ''}
						onChange={value => setAttributes({ sectionLabelFontSize: value })}
						placeholder="1.25em"
					/>

					<BaseControl
						id={dangerColorId}
						label={__('Danger color', 'fame_lahjoitukset')}
						help={__(
							'This defines the danger color for error messages and invalid input fields.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPalette
							value={colorValue(dangerColor, '#dc3545')}
							onChange={value => setAttributes({ dangerColor: value ?? '' })}
							disableCustomColors={false}
							enableAlpha={false}
						/>
					</BaseControl>

					<TextControl
						label={__('Border Radius', 'fame_lahjoitukset')}
						help={__(
							'This is the border-radius for selection buttons.',
							'fame_lahjoitukset'
						)}
						value={borderRadius ?? ''}
						onChange={value => setAttributes({ borderRadius: value })}
					/>

					<TextControl
						label={__('Border Width', 'fame_lahjoitukset')}
						help={__(
							'This is the border-width for selection buttons and input fields.',
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
				</PanelBody>
			</InspectorControls>

			<div
				{...useBlockProps({
					className:
						'fame-form__wrapper' +
						((attributes.layoutVersion ?? 0) >= 1
							? ' fame-form--editable-layout'
							: '') +
						(widthLimit ? ' fame-form--width-limited' : ''),
					ref: wrapperRef,
					style: styleVars,
				})}
			>
				{invalidBlocks.length > 0 && (
					<Notice
						status="error"
						isDismissible={false}
						className="fame-form__configuration-notice"
					>
						{__(
							'Another form is embedded in this donation form. Remove it or move it outside before saving.',
							'fame_lahjoitukset'
						)}
						<ul>
							{invalidBlocks.map(name => (
								<li key={name}>{getBlockType(name)?.title ?? name}</li>
							))}
						</ul>
					</Notice>
				)}
				{hasMisconfiguredFields && (
					<Notice
						status="error"
						isDismissible={false}
						className="fame-form__configuration-notice"
					>
						{__(
							'Complete the settings of the additional fields before saving.',
							'fame_lahjoitukset'
						)}
						<ul>
							{duplicateKeys.map(key => (
								<li key={`duplicate-${key}`}>
									{sprintf(
										/* translators: %s: the duplicated field key. */
										__(
											'The field key “%s” is used more than once.',
											'fame_lahjoitukset'
										),
										key
									)}
								</li>
							))}
							{misconfiguredFields.map(field => (
								<li key={field.clientId}>
									{field.attributes.label.trim() ||
										__('Additional field', 'fame_lahjoitukset')}
									{' — '}
									{field.problem}
								</li>
							))}
						</ul>
					</Notice>
				)}
				{missing.length > 0 && (
					<Notice
						status="error"
						isDismissible={false}
						className="fame-form__configuration-notice"
					>
						{__(
							'The donation form is incomplete. Restore the missing sections before saving.',
							'fame_lahjoitukset'
						)}
						<ul>
							{missing.map(name => (
								<li key={name}>{getBlockType(name)?.title ?? name}</li>
							))}
						</ul>
						<Button
							variant="secondary"
							onClick={() => {
								replaceInnerBlocks(
									clientId,
									restoreSections(innerBlocks, cols),
									false
								)
							}}
						>
							{__('Restore missing sections', 'fame_lahjoitukset')}
						</Button>
					</Notice>
				)}
				{showEditorHelp && (
					<p className="fame-form__editor-help">
						{__(
							'To add a block, select a block in the form. Open its three-dot menu, choose Add before or Add after, then click + to choose a block.',
							'fame_lahjoitukset'
						)}
					</p>
				)}
				<BlockContextProvider value={fieldContext}>
					<InnerBlocks
						allowedBlocks={TOP_ALLOWED_BLOCKS as unknown as string[]}
						templateLock="insert"
						renderAppender={() => null}
					/>
				</BlockContextProvider>
				<FormInserter clientId={clientId} formRef={wrapperRef} />
			</div>
		</>
	)
}
