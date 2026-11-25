import { describe, test, expect, jest } from '@jest/globals'
import { createBlock } from '@wordpress/blocks'
import {
	createInitialLayout,
	prepareLayout,
	resizeLayout,
	restoreSections,
	missingSections,
} from './layout'

jest.mock('@wordpress/blocks', () => {
	let id = 0
	return {
		createBlock: (name: string, attributes = {}, innerBlocks = []) => ({
			name,
			attributes,
			innerBlocks,
			clientId: `block-${++id}`,
		}),
		getBlockType: () => ({ attributes: { tagName: { default: 'div' } } }),
		getBlockTypes: () => [],
	}
})

const sectionNames = (top: any) =>
	top.innerBlocks.flatMap((column: any) => column.innerBlocks.map((block: any) => block.name))

describe('editable donation layout', () => {
	test('new columns start empty and reducing columns preserves reading order and content', () => {
		const [initial] = createInitialLayout(1)
		const expanded = resizeLayout(initial, 3)
		expect(expanded.attributes.templateLock).toBe('insert')
		expect(expanded.attributes.lock).toEqual({ remove: false })
		for (const column of expanded.innerBlocks) {
			expect(column.attributes.lock).toEqual({ remove: false })
			expect(column.attributes.templateLock).toBe(false)
		}
		expect(expanded.innerBlocks[1].innerBlocks).toEqual([])
		expect(expanded.innerBlocks[2].innerBlocks).toEqual([])
		const a = createBlock('core/paragraph', { content: 'Second column' })
		const b = createBlock('core/paragraph', { content: 'Third column' })
		expanded.innerBlocks[1].innerBlocks = [a]
		expanded.innerBlocks[2].innerBlocks = [b]
		const collapsed = resizeLayout(expanded, 1)
		expect(collapsed.innerBlocks).toHaveLength(1)
		expect(collapsed.innerBlocks[0].innerBlocks.slice(-2)).toEqual([a, b])
		expect(sectionNames(collapsed).slice(0, -2)).toEqual(sectionNames(initial))
	})

	test('removes old layout locks without changing the column content', () => {
		const paragraph = createBlock('core/paragraph', { content: 'Keep this block' })
		const column = createBlock('core/column', { templateLock: false, lock: { remove: true } }, [
			paragraph,
		])
		const columns = createBlock(
			'core/columns',
			{ templateLock: 'all', lock: { move: true, remove: true } },
			[column]
		)
		const prepared = prepareLayout(columns, false)
		expect(prepared.attributes.templateLock).toBe('insert')
		expect(prepared.attributes.lock).toEqual({ remove: false })
		expect(prepared.innerBlocks[0].attributes.lock).toEqual({ remove: false })
		expect(prepared.innerBlocks[0].innerBlocks[0]).toBe(paragraph)
	})

	test('moves legacy terms with their links out of the providers without duplicating them', () => {
		const terms = createBlock('core/paragraph', {
			content: 'Read <a href="/privacy">privacy policy</a>',
			className: 'fame-form__terms',
		})
		const providers = createBlock('famehelsinki/donation-providers', {}, [terms])
		const group = createBlock('core/group', { tagName: 'div' }, [providers])
		const top = createBlock('core/columns', {}, [createBlock('core/column', {}, [group])])
		const migrated = prepareLayout(top)
		const content = migrated.innerBlocks[0].innerBlocks
		expect(content.map(block => block.name)).toEqual([
			'famehelsinki/donation-providers',
			'core/paragraph',
		])
		expect(content[0].innerBlocks).toEqual([])
		expect(content[1]).toEqual(terms)
		expect(prepareLayout(migrated)).toBe(migrated)
	})

	test('keeps custom group styling and migrates terms within the group', () => {
		const terms = createBlock('core/paragraph', { content: 'Terms' })
		const group = createBlock('core/group', { style: { color: { text: '#123456' } } }, [
			createBlock('famehelsinki/donation-providers', {}, [terms]),
		])
		const top = createBlock('core/columns', {}, [createBlock('core/column', {}, [group])])
		const migratedGroup = prepareLayout(top).innerBlocks[0].innerBlocks[0]
		expect(migratedGroup.attributes.style).toEqual(group.attributes.style)
		expect(migratedGroup.innerBlocks[1]).toEqual(terms)
	})

	test('leaves reordered and explicitly unlocked controls in place', () => {
		const [top] = createInitialLayout(2)
		const content = top.innerBlocks[0].innerBlocks
		const providers = content.find(block => block.name === 'famehelsinki/donation-providers')!
		providers.attributes.lock = { remove: false, move: false }
		top.innerBlocks[0].innerBlocks = content.filter(block => block !== providers)
		top.innerBlocks[1].innerBlocks = [providers]
		const prepared = prepareLayout(top)
		expect(prepared.innerBlocks[1].innerBlocks).toEqual([providers])
		expect(providers.attributes.lock).toEqual({ remove: false, move: false })
		expect(prepared.innerBlocks[0].attributes.templateLock).toBe(false)
	})

	test('adds one independent terms paragraph before submit on new forms', () => {
		const [top] = createInitialLayout(1)
		const blocks = top.innerBlocks[0].innerBlocks
		const submitIndex = blocks.findIndex(block => block.name === 'famehelsinki/form-controls')
		expect(blocks[submitIndex - 1].attributes.className).toBe('fame-form__terms')
		expect(
			blocks.filter(block => block.attributes.className === 'fame-form__terms')
		).toHaveLength(1)
	})
})

test('preserves user-defined locks and custom groups when resizing', () => {
	const [top] = createInitialLayout(2)
	const columnLock = { move: true, remove: true }
	top.innerBlocks[0].attributes.lock = columnLock
	const group = createBlock('core/group', { lock: { remove: true, move: false } }, [
		createBlock('core/paragraph', { content: 'My group' }),
	])
	top.innerBlocks[1].innerBlocks = [group]
	const resized = resizeLayout(top, 1)
	expect(resized.innerBlocks[0].attributes.lock).toBe(columnLock)
	expect(resized.innerBlocks[0].innerBlocks.at(-1)).toBe(group)
})

describe('restoring missing sections', () => {
	test('rebuilds the columns when their contents were removed with the layout', () => {
		const emptyColumns = createBlock('core/columns', { className: 'custom-layout' })
		for (const original of [[], [emptyColumns]]) {
			const [layout] = restoreSections(original, 2)
			expect(layout.name).toBe('core/columns')
			expect(layout.innerBlocks.map(column => column.name)).toEqual([
				'core/column',
				'core/column',
			])
			expect(layout.innerBlocks[1].innerBlocks).toEqual([])
			expect(missingSections([layout])).toEqual([])
			expect(layout.attributes.className).toBe(original[0]?.attributes.className)
		}
	})

	test('restores donation type before the first later section, across columns', () => {
		const [top] = createInitialLayout(3)
		const amount = top.innerBlocks[0].innerBlocks.find(
			block => block.name === 'famehelsinki/donation-amounts'
		)!
		top.innerBlocks[0].innerBlocks = [createBlock('core/paragraph', { content: 'Intro' })]
		top.innerBlocks[1].innerBlocks = [amount]
		top.innerBlocks[2].innerBlocks = [
			createBlock('famehelsinki/donation-providers'),
			createBlock('famehelsinki/form-controls'),
		]
		const restored = restoreSections([top])[0]
		expect(restored.innerBlocks[0]).toBe(top.innerBlocks[0])
		expect(restored.innerBlocks[1].innerBlocks.map(block => block.name)).toEqual([
			'famehelsinki/donation-type',
			'famehelsinki/donation-amounts',
		])
		expect(missingSections([restored])).toEqual([])
	})

	test('restores flat legacy content without nesting controls inside another section', () => {
		const amount = createBlock('famehelsinki/donation-amounts')
		const restored = restoreSections([amount])
		expect(restored.map(block => block.name)).toEqual([
			'famehelsinki/donation-type',
			'famehelsinki/donation-amounts',
			'famehelsinki/donation-providers',
			'famehelsinki/form-controls',
		])
		expect(amount.innerBlocks).toEqual([])
	})

	test("does not count another donation form as its parent's required sections", () => {
		const [inner] = createInitialLayout(1)
		const nested = createBlock('famehelsinki/donation-form', {}, [inner])
		expect(missingSections([nested])).toHaveLength(4)
	})
})

test('restores outside closed Details and locked groups', () => {
	for (const container of [
		createBlock('core/details', {}, [createBlock('famehelsinki/contact-form')]),
		createBlock('core/group', { templateLock: 'all' }, [
			createBlock('famehelsinki/contact-form'),
		]),
	]) {
		const [top] = createInitialLayout(1)
		top.innerBlocks[0].innerBlocks = [
			createBlock('famehelsinki/donation-type'),
			container,
			createBlock('famehelsinki/donation-providers'),
			createBlock('famehelsinki/form-controls'),
		]
		const restored = restoreSections([top])[0].innerBlocks[0].innerBlocks
		expect(restored[1].name).toBe('famehelsinki/donation-amounts')
		expect(restored[2]).toBe(container)
		expect(container.innerBlocks).toHaveLength(1)
	}
})
