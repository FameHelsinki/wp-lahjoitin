import React, { useEffect } from 'react'
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

const DEFAULT_TERMS_TEXT = __(
	'Lahjoittamalla hyväksyt tietosuojakäytännön ja tilaus- ja peruutusehdot',
	'fame_lahjoitukset'
)

const TERMS_ANCHOR = 'fame-terms'

function buildInitialLayout(colsDesktop: 1 | 2 | 3): BlockInstance[] {
	const group = (inner: BlockInstance[] = []) => createBlock('core/group', {}, inner)

	const donationType = createBlock('famehelsinki/donation-type')
	const donationAmounts = createBlock('famehelsinki/donation-amounts')
	const contactForm = createBlock('famehelsinki/contact-form')
	const donationProviders = createBlock('famehelsinki/donation-providers')
	const formControls = createBlock('famehelsinki/form-controls')

	const termsParagraph = createBlock('core/paragraph', {
		anchor: TERMS_ANCHOR,
		content: DEFAULT_TERMS_TEXT,
	})

	const g1 = group([donationType, donationAmounts])
	const g2 = group([contactForm])
	const g3 = group([donationProviders, termsParagraph, formControls])

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

function findGroupContainingFormControls(groups: BlockInstance[]): BlockInstance | null {
	for (const g of groups) {
		const inner = (g.innerBlocks ?? []) as BlockInstance[]
		if (inner.some(b => b.name === 'famehelsinki/form-controls')) return g
	}
	return null
}

function isTermsParagraph(b: BlockInstance): boolean {
	return b.name === 'core/paragraph' && (b.attributes as any)?.anchor === TERMS_ANCHOR
}

/**
 * Ensure:
 * - exactly one terms paragraph (anchor=fame-terms)
 * - positioned right before famehelsinki/form-controls
 *
 * Returns SAME array reference if no changes are needed.
 */
function ensureTermsBeforeFormControls(children: BlockInstance[]): BlockInstance[] {
	const idxForm = children.findIndex(b => b.name === 'famehelsinki/form-controls')
	if (idxForm === -1) return children

	const termsIdxs: number[] = []
	for (let i = 0; i < children.length; i++) {
		if (isTermsParagraph(children[i])) termsIdxs.push(i)
	}

	// Missing: insert
	if (termsIdxs.length === 0) {
		const next = [...children]
		next.splice(
			idxForm,
			0,
			createBlock('core/paragraph', { anchor: TERMS_ANCHOR, content: DEFAULT_TERMS_TEXT })
		)
		return next
	}

	// One: move if needed
	if (termsIdxs.length === 1) {
		const idxTerms = termsIdxs[0]
		if (idxTerms === idxForm - 1) return children

		const next = [...children]
		const [terms] = next.splice(idxTerms, 1)
		const idxForm2 = next.findIndex(b => b.name === 'famehelsinki/form-controls')
		next.splice(idxForm2, 0, terms)
		return next
	}

	// Many: drop extras, then position
	const keepIdx = termsIdxs[0]
	let changed = false
	const filtered: BlockInstance[] = []
	for (let i = 0; i < children.length; i++) {
		const isTerms = isTermsParagraph(children[i])
		if (!isTerms) {
			filtered.push(children[i])
			continue
		}
		if (i === keepIdx) {
			filtered.push(children[i])
		} else {
			changed = true
		}
	}

	const idxForm2 = filtered.findIndex(b => b.name === 'famehelsinki/form-controls')
	const idxTerms2 = filtered.findIndex(isTermsParagraph)
	if (idxForm2 === -1 || idxTerms2 === -1) {
		return changed ? filtered : children
	}

	if (idxTerms2 === idxForm2 - 1) {
		return changed ? filtered : children
	}

	const out = [...filtered]
	const [terms] = out.splice(idxTerms2, 1)
	const idxForm3 = out.findIndex(b => b.name === 'famehelsinki/form-controls')
	out.splice(idxForm3, 0, terms)
	return out
}

/**
 * Repack: rebuild core/columns with desired col count,
 * but keep the SAME 3 group blocks (preserve content & clientIds).
 */
function repackColumns(colsDesktop: 1 | 2 | 3, currentTop: BlockInstance, groups: BlockInstance[]) {
	const next = buildColumnsFromGroups(colsDesktop, groups)
	// Preserve top-level columns attributes if you ever add any to columns
	next.attributes = { ...(currentTop.attributes as any) }
	return next
}

export default function Edit({
	attributes,
	setAttributes,
	clientId,
}: EditProps & { clientId: string }): React.JSX.Element {
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
		textFieldBorderRadius,
		colsDesktop,
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
		colsDesktop?: number
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
			| '--fame-border-radius'
			| '--fame-border-width'
			| '--fame-text-field-border-radius',
			string
		>
	>

	const styleVars: React.CSSProperties & ThemeVars = {
		'--primary-color': primaryColor ?? undefined,
		'--secondary-color': secondaryColor ?? undefined,
		'--third-color': thirdColor ?? undefined,
		'--fame-border-radius': borderRadius ?? undefined,
		'--fame-border-width': borderWidth ?? undefined,
		'--fame-text-field-border-radius': textFieldBorderRadius ?? undefined,
	}

	const primaryColorId = useInstanceId(BaseControl, 'primary-color')
	const secondaryColorId = useInstanceId(BaseControl, 'secondary-color')
	const thirdColorId = useInstanceId(BaseControl, 'third-color')

	const innerBlocks = useSelect(
		select => select(blockEditorStore).getBlocks(clientId) as BlockInstance[],
		[clientId]
	)
	const { replaceInnerBlocks } = useDispatch(blockEditorStore)

	/**
	 * Single effect that:
	 * - initializes if empty/broken
	 * - repacks columns when colsDesktop changes (without losing content)
	 * - ensures terms paragraph exists & is correctly placed
	 */
	useEffect(() => {
		const nextInit = buildInitialLayout(cols)

		// Init: empty
		if (!innerBlocks || innerBlocks.length === 0) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		const top = innerBlocks[0]
		const hasColumnsTop = innerBlocks.length === 1 && top?.name === 'core/columns'
		if (!hasColumnsTop) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		const groups = readTopGroups(innerBlocks)
		if (!groups) {
			replaceInnerBlocks(clientId, nextInit, false)
			return
		}

		// Ensure terms paragraph inside the group that has form-controls
		const group3 = findGroupContainingFormControls(groups)
		if (group3) {
			const children = (group3.innerBlocks ?? []) as BlockInstance[]
			const nextChildren = ensureTermsBeforeFormControls(children)

			if (nextChildren !== children) {
				// Replace only that group's inner blocks (preserves group block itself)
				replaceInnerBlocks(group3.clientId, nextChildren, false)
				return
			}
		}

		// Repack columns only if count differs
		const currentColCount = top.innerBlocks?.length ?? 0
		if (currentColCount !== cols) {
			const nextTop = repackColumns(cols, top as BlockInstance, groups)
			replaceInnerBlocks(clientId, [nextTop], false)
		}
	}, [cols, clientId, innerBlocks, replaceInnerBlocks])

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
						label={__('Tab background color', 'fame_lahjoitukset')}
						help={__('This is the background color for tabs.', 'fame_lahjoitukset')}
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
						label={__('Tabs text', 'fame_lahjoitukset')}
						help={__('This is the text color for selected tabs.', 'fame_lahjoitukset')}
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
						label={__('Input border & helper text', 'fame_lahjoitukset')}
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
						label={__('Return userinfo token', 'fame_lahjoitukset')}
						help={__(
							'This option includes userinfo token in the return address. This is not generally useful and requires custom logic to handle the token.',
							'fame_lahjoitukset'
						)}
						checked={!!token}
						onChange={token => setAttributes({ token })}
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
