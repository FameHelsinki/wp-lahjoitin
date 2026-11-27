import { __ } from '@wordpress/i18n'
import { FORM_BLOCK } from './insertion'
import { createBlock, getBlockType, type Block as BlockInstance } from '@wordpress/blocks'

export const LAYOUT_VERSION = 3
const COLUMNS_DEFAULTS = { templateLock: 'insert', lock: { remove: false } }
const COLUMN_DEFAULTS = { templateLock: false, lock: { remove: false } }

const SECTIONS = [
	'famehelsinki/donation-type',
	'famehelsinki/donation-campaigns',
	'famehelsinki/donation-amounts',
	'famehelsinki/recurring-due-date',
	'famehelsinki/contact-form',
	'famehelsinki/donation-providers',
	'famehelsinki/form-controls',
]
export const REQUIRED_SECTIONS = [
	'famehelsinki/donation-type',
	'famehelsinki/donation-amounts',
	'famehelsinki/donation-providers',
	'famehelsinki/form-controls',
]

export function missingSections(blocks: BlockInstance[]): string[] {
	const names = new Set<string>()
	const visit = (items: BlockInstance[]) =>
		items.forEach(block => {
			if (block.name === FORM_BLOCK) return
			names.add(block.name)
			visit(block.innerBlocks)
		})
	visit(blocks)
	return REQUIRED_SECTIONS.filter(name => !names.has(name))
}

/** Insert before the first later section, without imposing order on existing blocks. */
export function restoreSections(blocks: BlockInstance[], columnCount = 1): BlockInstance[] {
	const firstBlock = blocks[0]
	if (
		!firstBlock ||
		(blocks.length === 1 &&
			firstBlock.name === 'core/columns' &&
			!firstBlock.innerBlocks.length)
	) {
		const layout = firstBlock ?? createBlock('core/columns', COLUMNS_DEFAULTS)
		const sections = REQUIRED_SECTIONS.map(name => createBlock(name))
		const column = createBlock('core/column', COLUMN_DEFAULTS, sections)
		return [resizeLayout({ ...layout, innerBlocks: [column] }, columnCount)]
	}
	let next = blocks
	for (const name of missingSections(blocks)) {
		const rank = SECTIONS.indexOf(name)
		let inserted = false
		const section = createBlock(name)
		const insert = (items: BlockInstance[], canPlace = true): BlockInstance[] => {
			const result: BlockInstance[] = []
			let changed = false
			for (const item of items) {
				const templateLock = item.attributes.templateLock
				const layoutContainer =
					next.length === 1 &&
					item === next[0] &&
					item.name === 'core/columns' &&
					(templateLock === 'all' || templateLock === 'insert')
				const editableContainer =
					['core/columns', 'core/column', 'core/group'].includes(item.name) &&
					!templateLock
				const canDescend = editableContainer || layoutContainer
				const hasLaterSection = (block: BlockInstance): boolean =>
					block.name !== FORM_BLOCK &&
					(SECTIONS.indexOf(block.name) > rank || block.innerBlocks.some(hasLaterSection))
				if (
					!inserted &&
					canPlace &&
					(SECTIONS.indexOf(item.name) > rank || (!canDescend && hasLaterSection(item)))
				) {
					result.push(section)
					inserted = true
					changed = true
				}
				let current = item
				if (!inserted && canDescend) {
					const children = insert(item.innerBlocks, item.name !== 'core/columns')
					if (children !== item.innerBlocks) {
						current = { ...item, innerBlocks: children }
						changed = true
					}
				}
				result.push(current)
			}
			return changed ? result : items
		}
		next = insert(next)
		if (!inserted) {
			// A submit button belongs at the end, after the independent terms text.
			const top = next[0]
			if (
				next.length === 1 &&
				top?.name === 'core/columns' &&
				top.innerBlocks.length &&
				top.innerBlocks.every(column => column.name === 'core/column')
			) {
				const columns = [...top.innerBlocks]
				const last = columns.findLastIndex(column => !column.attributes.templateLock)
				if (last < 0) continue
				columns[last] = {
					...columns[last],
					innerBlocks: [...columns[last].innerBlocks, section],
				}
				next = [{ ...top, innerBlocks: columns }]
			} else next = [...next, section]
		}
	}
	return next
}

function withAttributes(block: BlockInstance, attributes: Record<string, unknown>): BlockInstance {
	if (
		Object.entries(attributes).every(
			([key, value]) => JSON.stringify(block.attributes[key]) === JSON.stringify(value)
		)
	)
		return block
	return { ...block, attributes: { ...block.attributes, ...attributes } }
}

function containerLock(block: BlockInstance) {
	const lock = block.attributes.lock as { move?: boolean; remove?: boolean } | undefined
	// Override the parent's insertion template so it doesn't prevent removing columns.
	// Older layouts also set both individual locks by default.
	if (lock?.move === true && lock.remove === true) return { remove: false }
	return { ...lock, remove: false }
}

/** Preserve styled legacy groups; unwrap only the old, unstyled layout groups. */
function migrateGroup(block: BlockInstance): BlockInstance[] {
	// The old providers block owned the terms paragraph. Move every legacy
	// child out after the provider, preserving content, links and reading order.
	// Clearing innerBlocks makes the migration idempotent and keeps save()
	// compatible with forms that have not been opened in the editor yet.
	if (block.name === 'famehelsinki/donation-providers' && block.innerBlocks.length) {
		return [{ ...block, innerBlocks: [] }, ...block.innerBlocks.flatMap(migrateGroup)]
	}

	if (block.name !== 'core/group') return [block]
	const defaults = getBlockType('core/group')?.attributes ?? {}
	const meaningful = Object.entries(block.attributes).some(([key, value]) => {
		if (key === 'lock') {
			if (typeof value !== 'object' || value === null) return false
			return ('move' in value && !!value.move) || ('remove' in value && !!value.remove)
		}
		if (key === 'templateLock') return !!value
		if (JSON.stringify(value) === JSON.stringify(defaults[key]?.default)) return false
		if (value === undefined || value === '' || value === false) return false
		if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
			return false
		}
		return true
	})
	if (!meaningful) return block.innerBlocks.flatMap(migrateGroup)
	const children = block.innerBlocks.flatMap(migrateGroup)
	const migrated =
		children.length !== block.innerBlocks.length ||
		children.some((child, index) => child !== block.innerBlocks[index])
	return [
		withAttributes(migrated ? { ...block, innerBlocks: children } : block, {
			templateLock: block.attributes.templateLock ?? false,
		}),
	]
}

export function prepareLayout(top: BlockInstance, migrateLegacy = true): BlockInstance {
	let next = withAttributes(top, {
		...COLUMNS_DEFAULTS,
		lock: containerLock(top),
	})
	const columns = next.innerBlocks.map(column => {
		if (column.name !== 'core/column') return column
		let prepared = withAttributes(column, {
			...COLUMN_DEFAULTS,
			lock: containerLock(column),
			allowedBlocks: undefined,
		})
		const content = migrateLegacy
			? prepared.innerBlocks.flatMap(migrateGroup)
			: prepared.innerBlocks
		if (
			content.length !== prepared.innerBlocks.length ||
			content.some((child, i) => child !== prepared.innerBlocks[i])
		) {
			prepared = { ...prepared, innerBlocks: content }
		}
		return prepared
	})
	if (columns.some((column, i) => column !== next.innerBlocks[i])) {
		next = { ...next, innerBlocks: columns }
	}
	return next
}

/** Increasing adds empty columns; decreasing appends overflow in reading order. */
export function resizeLayout(top: BlockInstance, count: number): BlockInstance {
	const columns = top.innerBlocks
	if (columns.some(column => column.name !== 'core/column')) return top
	if (columns.length === count) return top
	const kept = columns.slice(0, count)
	if (columns.length > count) {
		const last = kept[count - 1]
		kept[count - 1] = {
			...last,
			innerBlocks: [...last.innerBlocks, ...columns.slice(count).flatMap(c => c.innerBlocks)],
		}
	}
	while (kept.length < count) kept.push(createBlock('core/column', COLUMN_DEFAULTS))
	// Explicit widths from legacy layouts must not prevent equal-width columns.
	return {
		...top,
		innerBlocks: kept.map(column => withAttributes(column, { width: undefined })),
	}
}

export function createInitialLayout(count: number): BlockInstance[] {
	const initialSections = SECTIONS.filter(
		name => !['famehelsinki/donation-campaigns', 'famehelsinki/contact-form'].includes(name)
	)
	const top = createBlock('core/columns', {}, [
		createBlock(
			'core/column',
			{},
			initialSections.flatMap(name =>
				name === 'famehelsinki/form-controls'
					? [
							createBlock('core/paragraph', {
								className: 'fame-form__terms',
								placeholder: __(
									'Add privacy policy and terms text here…',
									'fame_lahjoitukset'
								),
							}),
							createBlock(name),
						]
					: [createBlock(name)]
			)
		),
	])
	return [resizeLayout(prepareLayout(top), count)]
}
