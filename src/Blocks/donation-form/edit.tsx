import React, { useEffect, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import {
	InspectorControls,
	InnerBlocks,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor'
import {
	PanelBody,
	TextControl,
	ToggleControl,
	CheckboxControl,
	ColorPicker,
	BaseControl,
	RangeControl,
} from '@wordpress/components'
import { useInstanceId } from '@wordpress/compose'
import { useDispatch, useSelect } from '@wordpress/data'
import { createBlock, type BlockInstance } from '@wordpress/blocks'

import { DEFAULT_DONATION_TYPE, getDonationLabel, DONATION_TYPES } from '../common/donation-type.ts'
import { EditProps } from '../common/types.ts'

const TOP_ALLOWED_BLOCKS = ['core/columns'] as const

function buildInitialLayout(colsDesktop: 1 | 2 | 3): BlockInstance[] {
	const group = (inner: BlockInstance[] = [], attrs: Record<string, any> = {}) =>
		createBlock('core/group', attrs, inner)

	const donationType = createBlock('famehelsinki/donation-type')
	const donationCampaigns = createBlock('famehelsinki/donation-campaigns')
	const donationAmounts = createBlock('famehelsinki/donation-amounts')
	const contactForm = createBlock('famehelsinki/contact-form')
	const donationProviders = createBlock('famehelsinki/donation-providers')
	const formControls = createBlock('famehelsinki/form-controls')

	const g1 = group([donationType, donationCampaigns, donationAmounts])

	const g2 = group([contactForm])

	const g3 = group([donationProviders, formControls])

	const columns = buildColumnsFromGroups(colsDesktop, [g1, g2, g3])
	return [columns]
}

function buildColumnsFromGroups(colsDesktop: 1 | 2 | 3, groups: BlockInstance[]): BlockInstance {
	let columnsContent: BlockInstance[][]
	if (colsDesktop === 1) {
		columnsContent = [[groups[0], groups[1], groups[2]]]
	} else if (colsDesktop === 2) {
		columnsContent = [[groups[0], groups[1]], [groups[2]]]
	} else {
		columnsContent = [[groups[0]], [groups[1]], [groups[2]]]
	}

	return createBlock(
		'core/columns',
		{},
		columnsContent.map(inner => createBlock('core/column', {}, inner))
	)
}

/**
 * Read the 3 core/group blocks inside the top columns, in visual order.
 * If not exactly 3 groups, return null (structure unexpected).
 */
function readTopGroups(blocks: BlockInstance[]): BlockInstance[] | null {
	const top = blocks?.[0]
	if (!top || top.name !== 'core/columns') return null

	const groups: BlockInstance[] = []
	for (const col of top.innerBlocks ?? []) {
		for (const child of col.innerBlocks ?? []) {
			if (child.name === 'core/group') groups.push(child as BlockInstance)
		}
	}
	return groups.length === 3 ? groups : null
}

/**
 * Repack: rebuild core/columns with desired col count,
 * but keep the SAME 3 group blocks.
 */
function repackColumns(colsDesktop: 1 | 2 | 3, currentTop: BlockInstance, groups: BlockInstance[]) {
	const next = buildColumnsFromGroups(colsDesktop, groups)
	// Preserve top-level columns attributes if you ever add any to columns
	return createBlock(
		next.name,
		{ ...(currentTop.attributes as any), ...(next.attributes as any) },
		next.innerBlocks
	)
}

export default function Edit({
	attributes,
	setAttributes,
	clientId,
}: EditProps & { clientId: string }): React.JSX.Element {
	const {
		types,
		returnAddress,
		token,
		primaryColor,
		secondaryColor,
		thirdColor,
		borderRadius,
		borderWidth,
		textFieldBorderRadius,
		colsDesktop,
		dangerColor,
	} = attributes as {
		types?: string[]
		returnAddress?: string
		primaryColor?: string
		secondaryColor?: string
		thirdColor?: string
		borderRadius?: string
		borderWidth?: string
		textFieldBorderRadius?: string
		token?: boolean
		colsDesktop?: number
		dangerColor?: string
	}

	const cols = Math.min(3, Math.max(1, colsDesktop ?? 3)) as 1 | 2 | 3

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
			| '--text-field-border-radius'
			| '--fame-clr-danger',
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
		'--fame-clr-danger': dangerColor ?? undefined,
	}

	const primaryColorId = useInstanceId(BaseControl, 'primary-color')
	const secondaryColorId = useInstanceId(BaseControl, 'secondary-color')
	const thirdColorId = useInstanceId(BaseControl, 'third-color')
	const dangerColorId = useInstanceId(BaseControl, 'fame-clr-danger')

	const innerBlocks = useSelect(
		select => select(blockEditorStore).getBlocks(clientId) as BlockInstance[],
		[clientId]
	)
	const { replaceInnerBlocks } = useDispatch(blockEditorStore)

	// Keep a ref so the effect always reads the latest inner blocks without
	// needing them in the dependency array (which would fire on every keystroke).
	const innerBlocksRef = useRef<BlockInstance[]>(innerBlocks)
	innerBlocksRef.current = innerBlocks

	/**
	 * Single effect that:
	 * - initializes if empty/broken
	 * - repacks columns when colsDesktop changes (without losing content)
	 *
	 * Intentionally omits `innerBlocks` and `replaceInnerBlocks` from deps:
	 * - `innerBlocks` is read via ref to avoid running on every child block change.
	 * - `replaceInnerBlocks` is a stable dispatch reference that never changes.
	 */
	useEffect(() => {
		const currentInnerBlocks = innerBlocksRef.current
		const nextInit = buildInitialLayout(cols)

		// Init: empty
		if (!currentInnerBlocks || currentInnerBlocks.length === 0) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		const top = currentInnerBlocks[0]
		const hasColumnsTop = currentInnerBlocks.length === 1 && top?.name === 'core/columns'
		if (!hasColumnsTop) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		const groups = readTopGroups(currentInnerBlocks)
		if (!groups) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		// Migration: insert donation-campaigns into g1 if it is missing.
		const g1 = groups[0]
		const hasCampaigns = g1.innerBlocks?.some(b => b.name === 'famehelsinki/donation-campaigns')
		if (!hasCampaigns) {
			const campaigns = createBlock('famehelsinki/donation-campaigns')
			const donationTypeIdx =
				g1.innerBlocks?.findIndex(b => b.name === 'famehelsinki/donation-type') ?? -1
			const insertAt = donationTypeIdx >= 0 ? donationTypeIdx + 1 : 0
			const newG1Inner = [
				...(g1.innerBlocks?.slice(0, insertAt) ?? []),
				campaigns,
				...(g1.innerBlocks?.slice(insertAt) ?? []),
			]
			const newG1 = createBlock('core/group', g1.attributes, newG1Inner)
			const nextTop = repackColumns(cols, top as BlockInstance, [newG1, groups[1], groups[2]])
			replaceInnerBlocks(clientId, [nextTop], false)
			return
		}

		// Repack columns only if count differs
		const currentColCount = top.innerBlocks?.length ?? 0
		if (currentColCount !== cols) {
			const nextTop = repackColumns(cols, top as BlockInstance, groups)
			replaceInnerBlocks(clientId, [nextTop], false)
		}
		// We intentionally read innerBlocks through a ref to avoid rerunning on every block edit.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cols, clientId])

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<RangeControl
						label={__('Desktop columns', 'fame_lahjoitukset')}
						help={__('Choose 1–3 columns for the form layout.', 'fame_lahjoitukset')}
						min={1}
						max={3}
						value={cols}
						onChange={(v?: number) => setAttributes({ colsDesktop: v ?? 3 })}
					/>

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
						onChange={newReturnAddress =>
							setAttributes({ returnAddress: newReturnAddress })
						}
					/>

					<BaseControl
						id={primaryColorId}
						label={__('Selected button background color', 'fame_lahjoitukset')}
						help={__(
							'This is the background color for selected buttons.',
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
						label={__('Selected button text color', 'fame_lahjoitukset')}
						help={__(
							'This is the text color for selected buttons.',
							'fame_lahjoitukset'
						)}
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
						label={__('Input border color', 'fame_lahjoitukset')}
						help={__(
							'This defines the border and helper text color of the input field.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPicker
							color={thirdColor || '#444'}
							onChangeComplete={value =>
								setAttributes({ thirdColor: value?.hex || '' })
							}
							disableAlpha
						/>
					</BaseControl>

					<BaseControl
						id={dangerColorId}
						label={__('Danger color', 'fame_lahjoitukset')}
						help={__(
							'This defines the danger color for error messages and invalid input fields.',
							'fame_lahjoitukset'
						)}
					>
						<ColorPicker
							color={dangerColor || '#dc3545'}
							onChangeComplete={value =>
								setAttributes({
									dangerColor:
										typeof value === 'string' ? value : value?.hex || '',
								})
							}
							disableAlpha
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

					<ToggleControl
						label={__('Return userinfo token', 'fame_lahjoitukset')}
						help={__(
							'This option includes userinfo token in the return address. This is not generally useful and requires custom logic to handle the token.',
							'fame_lahjoitukset'
						)}
						checked={!!token}
						onChange={newToken => setAttributes({ token: newToken })}
					/>
				</PanelBody>
			</InspectorControls>

			<div
				{...useBlockProps({
					className: 'fame-form__wrapper',
					style: styleVars,
				})}
			>
				<InnerBlocks
					allowedBlocks={TOP_ALLOWED_BLOCKS as unknown as string[]}
					templateLock="all"
					renderAppender={() => null}
				/>
			</div>
		</>
	)
}
