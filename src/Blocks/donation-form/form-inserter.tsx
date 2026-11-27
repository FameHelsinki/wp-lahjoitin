import React, { useEffect, useState, type RefObject } from 'react'
import { store as blockEditorStore } from '@wordpress/block-editor'
import { createBlock, getBlockType, isUnmodifiedDefaultBlock } from '@wordpress/blocks'
import { MenuGroup, MenuItem, NavigableMenu, Popover } from '@wordpress/components'
import { useDispatch, useRegistry, useSelect } from '@wordpress/data'
import { __ } from '@wordpress/i18n'
import { FORM_BLOCK } from './insertion'

const FORM_INSERTIONS = [
	'famehelsinki/contact-form',
	'famehelsinki/donation-campaigns',
	'core/paragraph',
	'core/heading',
]

const APPENDER = '.block-list-appender, .block-editor-default-block-appender'
const BETWEEN_BLOCKS = '.block-editor-block-list__insertion-point-inserter'
const EMPTY_BLOCK = '.block-editor-block-list__empty-block-inserter'
const PLUS_BUTTON = [
	'button.block-editor-inserter__toggle',
	'button.block-editor-button-block-appender',
	'button.block-list-appender__toggle',
].join(', ')

type Destination = {
	anchor: HTMLButtonElement
	rootClientId: string
	index?: number
	placeholderId?: string
	betweenBlocks: boolean
}

export default function FormInserter({
	clientId,
	formRef,
}: {
	clientId: string
	formRef: RefObject<HTMLDivElement>
}) {
	const registry = useRegistry()
	const { insertBlock, replaceBlocks, hideInsertionPoint } = useDispatch(blockEditorStore)
	const [destination, setDestination] = useState<Destination | null>(null)

	useEffect(() => {
		const form = formRef.current
		if (!form) return
		const editor = registry.select(blockEditorStore)
		const canvas = form.ownerDocument
		const host = canvas.defaultView?.frameElement?.ownerDocument

		// WordPress uses the same insertion permission for adding and moving blocks.
		// Replace the form's inline plus menu without narrowing that permission.
		function openFormMenu(event: MouseEvent) {
			const target = event.target as Element | null
			const anchor = target?.closest?.<HTMLButtonElement>(PLUS_BUTTON)
			if (!anchor || anchor.disabled) return

			const betweenBlocks = Boolean(anchor.closest(BETWEEN_BLOCKS))
			const besideEmptyBlock = Boolean(anchor.closest(EMPTY_BLOCK))
			const appender = anchor.closest(APPENDER)
			if (!betweenBlocks && !besideEmptyBlock && (!appender || !form?.contains(appender)))
				return

			let rootClientId: string | null | undefined
			let index: number | undefined
			let placeholderId: string | undefined
			if (besideEmptyBlock) {
				const selectedId = editor.getSelectedBlockClientId()
				if (!selectedId) return
				rootClientId = editor.getBlockRootClientId(selectedId)
				index = editor.getBlockIndex(selectedId)
				placeholderId = selectedId
			} else if (betweenBlocks) {
				const point = editor.getBlockInsertionPoint()
				rootClientId = point.rootClientId
				index = point.index
			} else {
				rootClientId =
					anchor.closest('[data-root-client-id]')?.getAttribute('data-root-client-id') ||
					appender
						?.closest('[data-block]:not([data-block=""])')
						?.getAttribute('data-block')
			}
			if (
				!rootClientId ||
				!editor.getBlockParentsByBlockName(rootClientId, FORM_BLOCK).includes(clientId)
			) {
				return
			}

			event.preventDefault()
			event.stopPropagation()
			setDestination({ anchor, rootClientId, index, placeholderId, betweenBlocks })
		}

		canvas.addEventListener('click', openFormMenu, true)
		host?.addEventListener('click', openFormMenu, true)
		return () => {
			canvas.removeEventListener('click', openFormMenu, true)
			host?.removeEventListener('click', openFormMenu, true)
		}
	}, [clientId, formRef, registry])

	const items = useSelect(
		select =>
			destination ? select(blockEditorStore).getInserterItems(destination.rootClientId) : [],
		[destination]
	)
	useEffect(() => {
		if (!destination) return
		const { anchor } = destination
		const wasExpanded = anchor.getAttribute('aria-expanded')
		anchor.setAttribute('aria-expanded', 'true')
		return () => {
			if (wasExpanded === null) anchor.removeAttribute('aria-expanded')
			else anchor.setAttribute('aria-expanded', wasExpanded)
		}
	}, [destination])
	if (!destination) return null

	const available = new Set(items.filter(item => !item.isDisabled).map(item => item.name))
	const options = FORM_INSERTIONS.filter(name => available.has(name))
		.map(name => getBlockType(name))
		.filter(block => block !== undefined)
	const close = () => {
		setDestination(null)
		if (destination.betweenBlocks) hideInsertionPoint()
	}
	const addBlock = (name: string) => {
		const { placeholderId, rootClientId, index } = destination
		const editor = registry.select(blockEditorStore)
		const block = createBlock(name)
		const placeholder = placeholderId ? editor.getBlock(placeholderId) : null
		if (
			placeholder &&
			editor.getBlockRootClientId(placeholder.clientId) === rootClientId &&
			isUnmodifiedDefaultBlock(placeholder)
		) {
			replaceBlocks(placeholder.clientId, block, 0)
		} else {
			insertBlock(block, index, rootClientId, true)
		}
		close()
	}

	return (
		<Popover
			anchor={destination.anchor}
			placement="bottom"
			focusOnMount="firstElement"
			onClose={close}
			onFocusOutside={close}
		>
			{options.length > 0 ? (
				<NavigableMenu role="menu" aria-label={__('Add block')}>
					<MenuGroup label={__('Lahjoitin blocks', 'fame_lahjoitukset')}>
						{options.map(block => (
							<MenuItem key={block.name} onClick={() => addBlock(block.name)}>
								{block.title}
							</MenuItem>
						))}
					</MenuGroup>
				</NavigableMenu>
			) : (
				<div className="block-editor-inserter__no-results">
					<p>{__('No results found.')}</p>
				</div>
			)}
		</Popover>
	)
}
