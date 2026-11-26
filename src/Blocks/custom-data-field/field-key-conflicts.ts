import { useLayoutEffect, useState } from 'react'
import { store as blockEditorStore } from '@wordpress/block-editor'
import type { Block } from '@wordpress/blocks'
import { useRegistry } from '@wordpress/data'
import {
	additionalFields,
	FIELD_KEY_CONFLICTS_CONTEXT,
	prefixedFieldKey,
	uniqueFieldKey,
} from './fields'

function findConflicts(
	blocks: Block[],
	previousOwners = new Map<string, string>(),
	previousBlockIds: ReadonlySet<string> = new Set()
) {
	const fields = additionalFields(blocks)
	const fieldsByKey = new Map<string, string[]>()
	for (const { clientId, attributes } of fields) {
		const key = prefixedFieldKey(attributes.fieldKey)
		if (!key) continue
		const group = fieldsByKey.get(key)
		if (group) group.push(clientId)
		else fieldsByKey.set(key, [clientId])
	}

	const owners = new Map<string, string>()
	const duplicateKeys: string[] = []
	const conflictingFieldIds: string[] = []
	const copyCandidates: { clientId: string; key: string }[] = []
	for (const [key, clientIds] of fieldsByKey) {
		if (clientIds.length === 1) {
			owners.set(key, clientIds[0])
			continue
		}
		duplicateKeys.push(key)
		const owner = previousOwners.get(key)
		if (!owner || !clientIds.includes(owner)) continue
		owners.set(key, owner)
		for (const clientId of clientIds) {
			if (clientId === owner) continue
			conflictingFieldIds.push(clientId)
			if (!previousBlockIds.has(clientId)) copyCandidates.push({ clientId, key })
		}
	}
	return {
		fields,
		owners,
		duplicateKeys,
		copyCandidates,
		fieldContext: { [FIELD_KEY_CONFLICTS_CONTEXT]: conflictingFieldIds },
	}
}

export function useFieldKeyConflicts(formId: string, blocks: Block[], editorBlockIds: string[]) {
	const registry = useRegistry()
	// Remember who already held a key in this editor session, even if blocks move.
	const [previous, setPrevious] = useState(() => ({
		blocks,
		editorBlockIds,
		conflicts: findConflicts(blocks),
	}))
	let conflicts = previous.conflicts
	if (previous.blocks !== blocks || previous.editorBlockIds !== editorBlockIds) {
		conflicts = findConflicts(blocks, conflicts.owners, new Set(previous.editorBlockIds))
		setPrevious({ blocks, editorBlockIds, conflicts })
	}

	useLayoutEffect(() => {
		const { fields, copyCandidates } = conflicts
		if (!copyCandidates.length) return
		const editor = registry.select(blockEditorStore)
		const { wasBlockJustInserted } = editor as typeof editor & {
			wasBlockJustInserted?: (clientId: string) => boolean
		}
		if (editor.getBlocks(formId) !== blocks || !wasBlockJustInserted) return

		const usedKeys = new Set(fields.map(field => prefixedFieldKey(field.attributes.fieldKey)))
		const updates: Record<string, { fieldKey: string }> = {}
		for (const { clientId, key } of copyCandidates) {
			// Insertion can be a single field or a group containing fields. A move
			// or a manual edit to an existing field must preserve its key.
			const inserted = [clientId, ...editor.getBlockParents(clientId)].some(id =>
				wasBlockJustInserted(id)
			)
			if (!inserted) continue
			const fieldKey = uniqueFieldKey(key, usedKeys)
			usedKeys.add(fieldKey)
			updates[clientId] = { fieldKey }
		}
		const clientIds = Object.keys(updates)
		if (!clientIds.length) return

		const actions = registry.dispatch(blockEditorStore) as unknown as {
			__unstableMarkNextChangeAsNotPersistent: () => void
			updateBlockAttributes: (
				clientIds: string[],
				attributes: typeof updates,
				options: { uniqueByBlock: true }
			) => void
		}
		registry.batch(() => {
			// Undo should remove the copy in one step, including its generated key.
			actions.__unstableMarkNextChangeAsNotPersistent()
			actions.updateBlockAttributes(clientIds, updates, { uniqueByBlock: true })
		})
	}, [blocks, conflicts, formId, registry])

	return conflicts
}
