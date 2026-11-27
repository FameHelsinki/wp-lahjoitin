import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@wordpress/e2e-test-utils-playwright'

function find(blocks: any[], name: string): any {
	for (const block of blocks) {
		if (block.name === name) return block
		const child = find(block.innerBlocks ?? [], name)
		if (child) return child
	}
}

async function setOrganization(requestUtils: any, slug = 'e2e-ok') {
	await requestUtils.rest({ path: '/wp/v2/settings', method: 'POST', data: { slug } })
}

for (const count of [1, 3]) {
	test(`legacy ${count}-column form keeps spacing and uses the column width after migration`, async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		await setOrganization(requestUtils)
		await admin.createNewPost({ title: 'Legacy geometry' })
		const original = readFileSync(
			resolve('tests/e2e/fixtures/legacy-donation-form.html'),
			'utf8'
		)
		const content = await page.evaluate(
			({ original: oldMarkup, count: columnCount }) => {
				const wp = (window as any).wp
				const blocks = wp.blocks.parse(oldMarkup)
				const form = blocks[0]
				if (columnCount === 3) {
					form.attributes.colsDesktop = columnCount
					const top = form.innerBlocks[0]
					top.innerBlocks = top.innerBlocks[0].innerBlocks.map((group: any) =>
						wp.blocks.createBlock('core/column', {}, [group])
					)
				}
				return wp.blocks.serialize(blocks)
			},
			{ original, count }
		)
		const post = await requestUtils.rest({
			path: '/wp/v2/posts',
			method: 'POST',
			data: {
				title: 'Legacy geometry',
				status: 'publish',
				content,
			},
		})
		await page.setViewportSize({ width: 1920, height: 1080 })
		const openWidePage = async () => {
			await page.goto(`/?p=${post.id}`)
			await page.addStyleTag({
				content: ':root { --wp--style--global--content-size: 980px; }',
			})
		}
		await openWidePage()
		const amounts = page.locator('form .wp-block-famehelsinki-donation-amounts')
		const measure = async () =>
			amounts.evaluate(element => ({
				width: element.getBoundingClientRect().width,
				columnWidth: element.closest('.wp-block-column')!.getBoundingClientRect().width,
				gap: parseFloat(getComputedStyle(element).marginBlockStart),
			}))
		const before = await measure()
		expect(before.width).toBeLessThanOrEqual(600)
		if (count === 1) expect(before.columnWidth).toBeGreaterThan(600)
		expect(before.gap).toBeGreaterThan(10)
		await expect(page.locator('.fame-form--editable-layout')).toHaveCount(0)
		await admin.editPost(post.id)
		await expect(
			editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')
		).toBeVisible()
		await page.evaluate(async () => {
			await (window as any).wp.data.dispatch('core/editor').savePost()
		})
		await openWidePage()
		const after = await measure()
		expect(Math.abs(after.width - after.columnWidth)).toBeLessThanOrEqual(4)
		if (count === 1) expect(after.width).toBeGreaterThan(600)
		expect(after.gap).toBeGreaterThan(10)
		await expect(page.locator('.fame-form--editable-layout')).toHaveCount(1)
	})
}

test('sets theme and custom widths from the donation form toolbar', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await page.setViewportSize({ width: 1920, height: 1080 })
	await admin.createNewPost({ title: 'Form widths' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	const block = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
	await expect(block.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	await editor.selectBlocks(block)
	await page.getByRole('button', { name: 'Width', exact: true }).click()
	const menu = page.locator('.fame-form-width-control')
	await expect(menu.getByRole('radio', { name: 'Theme default' })).toBeChecked()

	const publicPage = await page.context().newPage()
	try {
		await publicPage.setViewportSize({ width: 1920, height: 1080 })
		const publishCurrentLayout = async () => {
			const post = await requestUtils.rest({
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					title: 'Form width',
					status: 'publish',
					content: await editor.getEditedPostContent(),
				},
			})
			await publicPage.goto(`/?p=${post.id}`)
			return publicPage.locator('.wp-block-famehelsinki-donation-form')
		}
		await menu.getByRole('radio', { name: 'Content width' }).check()
		await expect(await publishCurrentLayout()).toHaveCSS('width', '645px')

		await menu.getByRole('radio', { name: /Wide width/ }).check()
		const wideForm = await publishCurrentLayout()
		await expect(wideForm).toHaveClass(/\balignwide\b/)
		await expect(wideForm).toHaveCSS('width', '1340px')

		await menu.getByRole('radio', { name: 'Full width' }).check()
		const fullForm = await publishCurrentLayout()
		await expect(fullForm).toHaveClass(/\balignfull\b/)
		const fullWidth = await fullForm.evaluate(element => element.getBoundingClientRect().width)
		expect(fullWidth).toBeGreaterThan(1340)

		await menu.getByRole('radio', { name: 'Custom width' }).check()
		const customWidth = menu.getByRole('spinbutton', { name: 'Maximum width (px)' })
		await customWidth.fill('480')
		await expect(block).toHaveCSS('width', '480px')
		await menu.getByRole('radio', { name: /Wide width/ }).check()
		await expect(customWidth).toHaveCount(0)
		await menu.getByRole('radio', { name: 'Custom width' }).check()
		await expect(customWidth).toHaveValue('480')
		await expect(block).toHaveCSS('width', '480px')
		const customForm = await publishCurrentLayout()
		await expect(customForm).toHaveCSS('width', '480px')
		await publicPage.setViewportSize({ width: 360, height: 800 })
		const mobileWidth = await customForm.evaluate(
			element => element.getBoundingClientRect().width
		)
		expect(mobileWidth).toBeLessThanOrEqual(360)
	} finally {
		await publicPage.close()
	}
})

test('only offers widths supported by the parent layout inside a column', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Form inside a column' })
	await editor.insertBlock({
		name: 'core/columns',
		innerBlocks: [
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'famehelsinki/donation-form',
						attributes: { formWidth: 'custom', formMaxWidth: 480 },
					},
				],
			},
		],
	})
	const block = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
	await expect(block.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	await editor.selectBlocks(block)
	await page.getByRole('button', { name: 'Width', exact: true }).click()
	const menu = page.locator('.fame-form-width-control')
	await expect(menu.getByRole('radio', { name: 'Custom width' })).toBeChecked()
	await expect(menu.getByRole('spinbutton', { name: 'Maximum width (px)' })).toHaveValue('480')
	await expect(menu.getByRole('radio', { name: /Wide width/ })).toHaveCount(0)
	await expect(menu.getByRole('radio', { name: 'Full width' })).toHaveCount(0)
})

for (const { theme, restricted, color, rgb } of [
	{ theme: 'twentytwentyfive', color: 'Accent 1', rgb: 'rgb(255, 238, 88)' },
	{ theme: 'twentyseventeen', color: 'Vivid red', rgb: 'rgb(207, 46, 46)' },
	{ theme: 'twentytwentyfive', restricted: true, color: 'Vivid red', rgb: 'rgb(207, 46, 46)' },
]) {
	const themeDescription = restricted ? `${theme} with restricted styles` : theme
	test(`styles the whole donation form within its custom width in ${themeDescription}`, async ({
		admin,
		editor,
		page,
		requestUtils,
	}) => {
		await requestUtils.activateTheme(theme)
		try {
			await setOrganization(requestUtils, restricted ? 'e2e-restricted' : 'e2e-ok')
			if (restricted) {
				const { settings } = await requestUtils.rest({
					path: `/wp/v2/global-styles/themes/${theme}`,
				})
				expect(settings.spacing.padding).toBe(false)
				expect(settings.border.radius).toBe(false)
				expect(settings.color.custom).toBe(false)
			}
			await page.setViewportSize({ width: 1920, height: 1080 })
			await admin.createNewPost({ title: 'Donation form styles' })
			await editor.insertBlock({
				name: 'famehelsinki/donation-form',
				attributes: {
					formWidth: 'custom',
					formMaxWidth: 480,
					style: {
						spacing: {
							padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
						},
						border: { color: '#401060', style: 'solid', width: '3px', radius: '16px' },
					},
				},
			})
			const block = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
			await expect(block.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
			await editor.selectBlocks(block)
			if (theme === 'twentyseventeen') {
				const widthButton = page.getByRole('button', { name: 'Width', exact: true })
				await widthButton.click()
				const menu = page.locator('.fame-form-width-control')
				await expect(
					menu.getByRole('radio', { name: /Wide width|Full width/ })
				).toHaveCount(0)
				await menu.getByRole('radio', { name: 'Theme default' }).check()
				await menu.getByRole('radio', { name: 'Custom width' }).check()
				await expect(
					menu.getByRole('spinbutton', { name: 'Maximum width (px)' })
				).toHaveValue('480')
				await widthButton.click()
			}
			await editor.openDocumentSettingsSidebar()
			await page.getByRole('tab', { name: 'Styles', exact: true }).click()
			await expect(page.getByText('Padding', { exact: true })).toBeVisible()
			await expect(page.getByText('Radius', { exact: true })).toBeVisible()
			await page
				.locator('.background-block-support-panel')
				.getByRole('button', { name: 'Color', exact: true })
				.click()
			const colorPicker = page.locator(
				'.block-editor-panel-color-gradient-settings__dropdown-content'
			)
			await expect(
				colorPicker.getByRole('button', { name: /Custom color picker/ })
			).toBeVisible()
			await colorPicker.getByRole('option', { name: color, exact: true }).click()
			const post = await requestUtils.rest({
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					title: 'Donation form styles',
					status: 'publish',
					content: await editor.getEditedPostContent(),
				},
			})
			const expectFormStyles = async (form: typeof block) => {
				await expect(form).toHaveCSS('background-color', rgb)
				await expect(form).toHaveCSS('padding-top', '24px')
				await expect(form).toHaveCSS('border-top-width', '3px')
				await expect(form).toHaveCSS('border-top-style', 'solid')
				await expect(form).toHaveCSS('border-top-color', 'rgb(64, 16, 96)')
				await expect(form).toHaveCSS('border-top-left-radius', '16px')
				await expect(form).toHaveCSS('width', '480px')
			}
			await expectFormStyles(block)
			await page.goto(`/?p=${post.id}`)
			await expectFormStyles(page.locator('.wp-block-famehelsinki-donation-form'))
		} finally {
			await setOrganization(requestUtils)
			await requestUtils.activateTheme('twentytwentyfive')
		}
	})
}

test('missing required sections block saving and can be restored; invalid saved forms fail safely', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Required sections' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	await expect(editor.canvas.locator('[data-type="famehelsinki/form-controls"]')).toBeVisible()
	const controls = find(await editor.getBlocks({ full: true }), 'famehelsinki/form-controls')
	await page.evaluate(id => {
		;(window as any).wp.data.dispatch('core/block-editor').removeBlocks([id])
	}, controls.clientId)
	const wasProtected = await page.evaluate(
		id => Boolean((window as any).wp.data.select('core/block-editor').getBlock(id)),
		controls.clientId
	)
	expect(wasProtected).toBe(true)
	await page.evaluate(id => {
		const actions = (window as any).wp.data.dispatch('core/block-editor')
		actions.updateBlockAttributes(id, { lock: { move: false, remove: false } })
		actions.removeBlocks([id])
	}, controls.clientId)
	await expect(
		editor.canvas.getByText(
			'The donation form is incomplete. Restore the missing sections before saving.'
		)
	).toBeVisible()
	expect(
		await page.evaluate(() =>
			(window as any).wp.data.select('core/editor').isPostSavingLocked()
		)
	).toBe(true)
	const content = await editor.getEditedPostContent()
	await editor.canvas.getByRole('button', { name: 'Restore missing sections' }).click()
	await expect(editor.canvas.locator('[data-type="famehelsinki/form-controls"]')).toBeVisible()
	const restored = find(await editor.getBlocks({ full: true }), 'famehelsinki/form-controls')
	expect(restored.attributes.lock.remove).toBe(true)
	await expect
		.poll(() =>
			page.evaluate(() => (window as any).wp.data.select('core/editor').isPostSavingLocked())
		)
		.toBe(false)
	// An API write can bypass the editor's guard. PHP must handle that too.
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title: 'Incomplete API form',
			status: 'publish',
			content,
		},
	})
	await page.goto(`/?p=${post.id}`)
	await expect(page.getByRole('status')).toHaveText(
		'The donation form is temporarily unavailable because its configuration is incomplete.'
	)
	await expect(page.locator('form.fame-form--donations')).toHaveCount(0)
})

test('styled groups move between columns and user-defined locks survive edits', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Group movement and locks' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form', attributes: { colsDesktop: 2 } })
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	const form = find(await editor.getBlocks({ full: true }), 'famehelsinki/donation-form')
	const columns = find([form], 'core/columns')
	await editor.insertBlock(
		{
			name: 'core/group',
			attributes: { style: { color: { text: '#123456' } } },
			innerBlocks: [{ name: 'core/paragraph', attributes: { content: 'Movable group' } }],
		},
		{ clientId: columns.innerBlocks[0].clientId }
	)
	const group = find(await editor.getBlocks({ full: true }), 'core/group')
	const amount = find(await editor.getBlocks({ full: true }), 'famehelsinki/donation-amounts')
	await page.evaluate(
		({ group: movedGroup, amount: lockedAmount, form: editedForm, columns: layoutColumns }) => {
			const actions = (window as any).wp.data.dispatch('core/block-editor')
			actions.moveBlocksToPosition(
				[movedGroup.clientId],
				layoutColumns.innerBlocks[0].clientId,
				layoutColumns.innerBlocks[1].clientId,
				0
			)
			actions.updateBlockAttributes(lockedAmount.clientId, {
				lock: { remove: true, move: false },
			})
			actions.updateBlockAttributes(editedForm.clientId, { returnAddress: '/thank-you' })
		},
		{ group, amount, form, columns }
	)
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'core/columns').innerBlocks[1]
					.innerBlocks[0]?.name
		)
		.toBe('core/group')
	const current = await editor.getBlocks({ full: true })
	expect(find(current, 'core/group').attributes.style).toEqual(group.attributes.style)
	expect(find(current, 'famehelsinki/donation-amounts').attributes.lock).toEqual({
		remove: true,
		move: false,
	})
})

test('functional palette colors render and an unset legend weight respects the theme', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Theme styles' })
	await editor.insertBlock({
		name: 'famehelsinki/donation-form',
		attributes: {
			primaryColor: 'rgb(30 30 30)',
			thirdColor: 'hsl(120 100% 25%)',
			sectionLabelColor: '',
			style: { color: { text: '#264653' } },
		},
	})
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	const column = find(await editor.getBlocks({ full: true }), 'core/column')
	await editor.insertBlock({ name: 'famehelsinki/contact-form' }, { clientId: column.clientId })
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'famehelsinki/donation-providers')
					.attributes.providers?.length ?? 0
		)
		.toBeGreaterThan(0)
	const id = await editor.publishPost()
	await page.goto(`/?p=${id}`)
	await page.addStyleTag({ content: 'legend { font-weight: 600; }' })
	const form = page.locator('form.fame-form--donations')
	const input = form.locator('input[name="email"]')
	await expect(input).toHaveCSS('border-top-color', 'rgb(0, 128, 0)')
	const unselectedAmount = form
		.locator('.donation-amounts .fame-form__label:not(:has(:checked)):visible')
		.first()
	await expect(unselectedAmount).toHaveCSS('color', 'rgb(38, 70, 83)')
	await expect(input).toHaveCSS('color', 'rgb(38, 70, 83)')
	await expect(form.locator('legend').first()).toHaveCSS('font-weight', '600')
	await expect(page.locator('.fame-form--editable-layout')).toHaveCSS(
		'--primary-color',
		'rgb(30 30 30)'
	)
	await expect(form.locator('.fame-form__terms')).toBeHidden()
})

test('saved layouts stay clean when reopened and support 1-to-3-column Undo and Redo', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Clean remount and Undo Redo' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'famehelsinki/donation-providers')
					?.attributes.providers?.length ?? 0
		)
		.toBeGreaterThan(0)
	const id = await editor.publishPost()
	await admin.editPost(id)
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	await expect
		.poll(() =>
			page.evaluate(() => (window as any).wp.data.select('core/editor').isEditedPostDirty())
		)
		.toBe(false)
	const stored = await requestUtils.rest({
		path: `/wp/v2/posts/${id}`,
		params: { context: 'edit' },
		method: 'GET',
	})
	expect(await editor.getEditedPostContent()).toBe(stored.content.raw)
	const columnsBlock = editor.canvas.locator(
		'[data-type="famehelsinki/donation-form"] [data-type="core/columns"]'
	)
	await editor.selectBlocks(columnsBlock)
	await editor.openDocumentSettingsSidebar()
	await page.getByRole('spinbutton', { name: 'Desktop columns' }).fill('3')
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'core/columns').innerBlocks.length
		)
		.toBe(3)
	await editor.selectBlocks(columnsBlock)
	await page.keyboard.press('ControlOrMeta+z')
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'core/columns').innerBlocks.length
		)
		.toBe(1)
	await expect(page.getByRole('spinbutton', { name: 'Desktop columns' })).toHaveValue('1')
	await page.keyboard.press('ControlOrMeta+Shift+z')
	await expect
		.poll(
			async () =>
				find(await editor.getBlocks({ full: true }), 'core/columns').innerBlocks.length
		)
		.toBe(3)
	await expect(page.getByRole('spinbutton', { name: 'Desktop columns' })).toHaveValue('3')
})

test('native form blocks are rejected inside columns and groups; unsafe API writes fail safely', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'No nested native forms' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	const column = find(await editor.getBlocks({ full: true }), 'core/column')
	await editor.insertBlock({ name: 'core/group' }, { clientId: column.clientId })
	const group = find(await editor.getBlocks({ full: true }), 'core/group')
	const results = await page.evaluate(
		({ columnId, groupId }) => {
			const store = (window as any).wp.data.select('core/block-editor')
			return [columnId, groupId].map(root =>
				[
					'famehelsinki/donation-form',
					'core/search',
					'core/loginout',
					'core/post-comments-form',
				].map(name => store.canInsertBlockType(name, root))
			)
		},
		{ columnId: column.clientId, groupId: group.clientId }
	)
	expect(results).toEqual([
		[false, false, false, false],
		[false, false, false, false],
	])
	const unsafe = await page.evaluate(() => {
		const wp = (window as any).wp
		const blocks = wp.data.select('core/block-editor').getBlocks()
		const clone = wp.blocks.parse(wp.blocks.serialize(blocks))
		clone[0].innerBlocks[0].innerBlocks[0].innerBlocks.push(
			wp.blocks.createBlock('core/search')
		)
		return wp.blocks.serialize(clone)
	})
	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title: 'Unsafe nested form', status: 'publish', content: unsafe },
	})
	await page.goto(`/?p=${post.id}`)
	await expect(page.locator('form.fame-form--donations')).toHaveCount(0)
	await expect(page.getByRole('status')).toContainText('contains another form')
})

test('the form inserter offers optional sections and inserts headings before submit', async ({
	admin,
	editor,
	page,
}) => {
	await admin.createNewPost({ title: 'Add a form section' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	const form = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
	const submit = form.locator('[data-type="famehelsinki/form-controls"]')
	await expect(submit).toBeVisible()
	await editor.selectBlocks(form)
	const help = form.locator('.fame-form__editor-help')
	await expect(help).toContainText('Add before or Add after')
	await expect(help).toHaveCSS('background-color', 'rgb(240, 246, 252)')
	await editor.selectBlocks(submit)
	await expect(help).toBeVisible()
	await editor.clickBlockOptionsMenuItem('Add before')
	await page.locator('.block-editor-block-list__empty-block-inserter button').click()

	const menu = page.getByRole('menu', { name: 'Add block', exact: true })
	for (const name of ['Contact form', 'Campaigns', 'Paragraph', 'Heading']) {
		await expect(menu.getByRole('menuitem', { name, exact: true })).toBeVisible()
	}
	await menu.getByRole('menuitem', { name: 'Heading', exact: true }).click()
	await expect(
		form.locator('[data-type="core/heading"] + [data-type="famehelsinki/form-controls"]')
	).toHaveCount(1)
})

test('an added field uses a stable automatic key with an override in Advanced', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Add a donation field' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	const form = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
	const submit = form.locator('[data-type="famehelsinki/form-controls"]')
	await expect(submit).toBeVisible()
	await editor.selectBlocks(submit)
	await editor.clickBlockOptionsMenuItem('Add before')
	await page.locator('.block-editor-block-list__empty-block-inserter button').click()

	const menu = page.getByRole('menu', { name: 'Add block', exact: true })
	await expect(menu.getByRole('menuitem').first()).toHaveText('Additional field')
	await menu.getByRole('menuitem', { name: 'Additional field' }).click()
	await expect(
		form.locator(
			'[data-type="famehelsinki/custom-data-field"] + [data-type="famehelsinki/form-controls"]'
		)
	).toHaveCount(1)
	await expect
		.poll(() =>
			page.evaluate(
				() => (window as any).wp.data.select('core/block-editor').getSelectedBlock()?.name
			)
		)
		.toBe('famehelsinki/custom-data-field')

	await editor.openDocumentSettingsSidebar()
	const label = page.getByRole('textbox', { name: 'Label', exact: true })
	const inlineLabel = form
		.locator('[data-type="famehelsinki/custom-data-field"]')
		.getByRole('textbox', { name: 'Label', exact: true })
	const key = page.getByRole('textbox', { name: 'Field key', exact: true })
	await expect(key).toHaveCount(0)
	await inlineLabel.pressSequentially('Tilaan & luen uutiskirjeen')
	await expect(label).toHaveValue('Tilaan & luen uutiskirjeen')
	await page.getByRole('button', { name: 'Advanced', exact: true }).click()
	const prefix = page.getByRole('region', { name: 'Editor settings' }).getByText('custom_', {
		exact: true,
	})
	await expect(prefix).toBeVisible()
	await expect(prefix.locator('..')).toHaveCSS('display', 'flex')
	await expect(key).toHaveValue('tilaan_luen_uutiskirjeen')
	await label.fill('Uutiset & tapahtumat')
	await label.press('Tab')
	await expect(inlineLabel).toHaveText('Uutiset & tapahtumat')
	await expect(key).toHaveValue('tilaan_luen_uutiskirjeen')
	await key.fill('')
	await key.press('Tab')
	await expect(key).toHaveValue('uutiset_tapahtumat')
	await key.fill('newsletter')
	await key.press('Tab')
	await expect(key).toHaveValue('newsletter')
	await key.fill('custom_newsletter')
	await key.press('Tab')
	await expect(key).toHaveValue('newsletter')

	const id = await editor.publishPost()
	await page.goto(`/?p=${id}`)
	await expect(page.getByRole('textbox', { name: 'Uutiset & tapahtumat' })).toHaveAttribute(
		'name',
		'custom_data[custom_newsletter]'
	)
})

test('copies get numbered additional field keys and unresolved conflicts block saving', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Copied additional field' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	const form = editor.canvas.locator('[data-type="famehelsinki/donation-form"]')
	await expect(form.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	const column = find(await editor.getBlocks({ full: true }), 'core/column')
	const fieldName = 'famehelsinki/custom-data-field'
	await editor.insertBlock(
		{
			name: fieldName,
			attributes: {
				fieldType: 'select',
				label: 'Newsletter frequency',
				fieldKey: 'custom_newsletter',
				choices: [{ label: 'Monthly digest', value: 'monthly' }],
			},
		},
		{ clientId: column.clientId }
	)
	const fields = form.locator(`[data-type="${fieldName}"]`)
	await expect(fields.first().getByRole('combobox')).toBeVisible()
	const originalId = await fields.first().getAttribute('data-block')
	const duplicate = () =>
		page.evaluate(async id => {
			const [copy] = await (window as any).wp.data
				.dispatch('core/block-editor')
				.duplicateBlocks([id])
			return copy
		}, originalId)
	const readKey = (id: string) =>
		page.evaluate(
			clientId =>
				(window as any).wp.data.select('core/block-editor').getBlockAttributes(clientId)
					?.fieldKey,
			id
		)
	const copyId = await duplicate()
	await expect.poll(() => readKey(copyId)).toBe('custom_newsletter_2')
	const secondCopyId = await duplicate()
	await expect.poll(() => readKey(secondCopyId)).toBe('custom_newsletter_3')
	await expect(fields).toHaveCount(3)
	await page.evaluate(() => (window as any).wp.data.dispatch('core/editor').undo())
	await expect(fields).toHaveCount(2)
	await page.evaluate(() => (window as any).wp.data.dispatch('core/editor').redo())
	await expect(fields).toHaveCount(3)
	await expect.poll(() => readKey(secondCopyId)).toBe('custom_newsletter_3')

	const original = form.locator(`[data-block="${originalId}"]`)
	const copy = form.locator(`[data-block="${copyId}"]`)
	const duplicateMessage = form
		.locator('.components-notice.is-error')
		.getByText('The field key “custom_newsletter” is used more than once.')
	const sidebar = page.getByRole('region', { name: 'Editor settings' })
	const repairMessage = sidebar
		.locator('.components-notice.is-error')
		.getByText(
			'This field key is already used. Clear this field’s key in Advanced to generate a new one.'
		)
	const savingLocked = () =>
		page.evaluate(() => (window as any).wp.data.select('core/editor').isPostSavingLocked())
	await expect.poll(savingLocked).toBe(false)

	await page.evaluate(
		({ copyBlock, columnId }) =>
			(window as any).wp.data
				.dispatch('core/block-editor')
				.moveBlocksToPosition([copyBlock], columnId, columnId, 0),
		{ copyBlock: copyId, columnId: column.clientId }
	)
	await expect(fields.first()).toHaveAttribute('data-block', copyId)
	await editor.selectBlocks(copy)
	await editor.openDocumentSettingsSidebar()
	await page.getByRole('button', { name: 'Advanced', exact: true }).click()
	const key = page.getByRole('textbox', { name: 'Field key', exact: true })
	await expect(key).toHaveValue('newsletter_2')
	await key.fill('newsletter')
	await key.press('Tab')
	await expect(duplicateMessage).toHaveCount(1)
	await expect(repairMessage).toBeVisible()
	await expect.poll(savingLocked).toBe(true)
	const invalidContent = await editor.getEditedPostContent()
	await key.fill('newsletter_2')
	await key.press('Tab')
	await expect(key).toHaveValue('newsletter_2')
	await expect(duplicateMessage).toHaveCount(0)
	await expect.poll(savingLocked).toBe(false)
	await editor.selectBlocks(original)
	await expect(key).toHaveValue('newsletter')

	const post = await requestUtils.rest({
		path: '/wp/v2/posts',
		method: 'POST',
		data: { title: 'Previously conflicting fields', status: 'draft', content: invalidContent },
	})
	await admin.editPost(post.id)
	await expect(duplicateMessage).toHaveCount(1)
	await expect.poll(savingLocked).toBe(true)
	await editor.selectBlocks(fields.first())
	await editor.openDocumentSettingsSidebar()
	await expect(repairMessage).toHaveCount(0)
	await editor.selectBlocks(fields.nth(1))
	await expect(repairMessage).toHaveCount(0)
})

test('restoring donation type puts it before amount fields instead of after submit', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Restore in reading order' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-type"]')).toBeVisible()
	const type = find(await editor.getBlocks({ full: true }), 'famehelsinki/donation-type')
	await page.evaluate(id => {
		const actions = (window as any).wp.data.dispatch('core/block-editor')
		actions.updateBlockAttributes(id, { lock: { move: false, remove: false } })
		actions.removeBlocks([id])
	}, type.clientId)
	await editor.canvas.getByRole('button', { name: 'Restore missing sections' }).click()
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-type"]')).toBeVisible()
	const content = find(await editor.getBlocks({ full: true }), 'core/column').innerBlocks
	const names = content.map((block: any) => block.name)
	expect(names.indexOf('famehelsinki/donation-type')).toBeLessThan(
		names.indexOf('famehelsinki/donation-amounts')
	)
	expect(names.indexOf('famehelsinki/donation-type')).toBeLessThan(
		names.indexOf('famehelsinki/form-controls')
	)
})

test('existing Custom HTML forms and pasted search blocks show a warning and block saving', async ({
	admin,
	editor,
	page,
	requestUtils,
}) => {
	await setOrganization(requestUtils)
	await admin.createNewPost({ title: 'Embedded content warning' })
	await editor.insertBlock({ name: 'famehelsinki/donation-form' })
	await expect(editor.canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
	for (const name of ['core/html', 'core/group']) {
		const inserted = await page.evaluate(blockName => {
			const wp = (window as any).wp
			const store = wp.data.select('core/block-editor')
			const form = store.getBlocks()[0]
			const column = form.innerBlocks[0].innerBlocks[0]
			const extra =
				blockName === 'core/html'
					? wp.blocks.parse(
							'<!-- wp:html -->\n<form><input name="newsletter"></form>\n<!-- /wp:html -->'
						)[0]
					: wp.blocks.createBlock('core/group', {}, [
							wp.blocks.createBlock('core/search'),
						])
			wp.data
				.dispatch('core/block-editor')
				.replaceInnerBlocks(column.clientId, [...column.innerBlocks, extra], false)
			return extra.clientId
		}, name)
		await expect(
			editor.canvas.getByText(
				'Another form is embedded in this donation form. Remove it or move it outside before saving.'
			)
		).toBeVisible()
		expect(
			await page.evaluate(() =>
				(window as any).wp.data.select('core/editor').isPostSavingLocked()
			)
		).toBe(true)
		await page.evaluate(id => {
			;(window as any).wp.data.dispatch('core/block-editor').removeBlocks([id])
		}, inserted)
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as any).wp.data.select('core/editor').isPostSavingLocked()
				)
			)
			.toBe(false)
	}
})
