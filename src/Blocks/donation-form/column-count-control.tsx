import React, { type ComponentType } from 'react'
import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor'
import { type Block as BlockInstance } from '@wordpress/blocks'
import { PanelBody, RangeControl } from '@wordpress/components'
import { createHigherOrderComponent } from '@wordpress/compose'
import { useDispatch, useRegistry, useSelect } from '@wordpress/data'
import { __ } from '@wordpress/i18n'
import { FORM_BLOCK } from './insertion'
import { resizeLayout } from './layout'

function ColumnCountControl({ clientId }: { clientId: string }) {
	const { formId, columnCount } = useSelect(
		select => {
			const editor = select(blockEditorStore)
			const parentId = editor.getBlockRootClientId(clientId)
			if (
				!parentId ||
				editor.getBlockName(parentId) !== FORM_BLOCK ||
				editor.getBlockOrder(parentId)[0] !== clientId
			) {
				return { formId: null, columnCount: 0 }
			}
			return { formId: parentId, columnCount: editor.getBlockOrder(clientId).length }
		},
		[clientId]
	)
	const registry = useRegistry()
	const { updateBlockAttributes, replaceInnerBlocks } = useDispatch(blockEditorStore)
	if (!formId) return null

	const changeColumns = (value?: number) => {
		const layout = registry.select(blockEditorStore).getBlock(clientId) as BlockInstance | null
		if (!layout) return
		const count = Math.min(3, Math.max(1, value ?? 1))
		const resized = resizeLayout(layout, count)
		if (resized === layout) return
		registry.batch(() => {
			updateBlockAttributes(formId, { colsDesktop: count })
			replaceInnerBlocks(clientId, resized.innerBlocks, false)
		})
	}

	return (
		<InspectorControls>
			<PanelBody title={__('Layout')}>
				<RangeControl
					label={__('Desktop columns', 'fame_lahjoitukset')}
					help={__(
						'Choose 1–3 columns. New columns start empty. Removing columns moves their blocks to the end of the last remaining column.',
						'fame_lahjoitukset'
					)}
					min={1}
					max={3}
					value={Math.max(1, columnCount)}
					onChange={changeColumns}
				/>
			</PanelBody>
		</InspectorControls>
	)
}

type BlockEditProps = { name: string; clientId: string; isSelected?: boolean }

export const withColumnCountControl = createHigherOrderComponent(
	(BlockEdit: ComponentType<BlockEditProps>) =>
		function EditWithColumnCountControl(props: BlockEditProps) {
			return (
				<>
					<BlockEdit {...props} />
					{props.name === 'core/columns' && props.isSelected && (
						<ColumnCountControl clientId={props.clientId} />
					)}
				</>
			)
		},
	'withColumnCountControl'
)
