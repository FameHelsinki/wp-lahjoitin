import { test, expect } from '@wordpress/e2e-test-utils-playwright'

/**
 * End-to-end flow for the donation form.
 *
 * The lahjoitin backend is simulated by the fame-e2e-backend-mock mu-plugin:
 * organization slug "e2e-ok" has providers enabled, "e2e-fail" simulates an
 * unreachable backend. The browser-side donation POST is mocked per test with
 * page.route(), so no external network is involved.
 */

async function setOrganizationSlug(requestUtils: any, slug: string) {
	await requestUtils.rest({
		path: '/wp/v2/settings',
		method: 'POST',
		data: { slug },
	})
}

test.describe('donation form', () => {
	test.describe.configure({ mode: 'serial' })

	let postId: number

	test.beforeAll(async ({ requestUtils }) => {
		await setOrganizationSlug(requestUtils, 'e2e-ok')
	})

	test('is scaffolded in the editor and publishes', async ({ admin, editor }) => {
		await admin.createNewPost({ title: 'Donation form e2e' })
		await editor.insertBlock({ name: 'famehelsinki/donation-form' })

		// The block builds its inner layout on insert.
		const canvas = editor.canvas
		await expect(canvas.locator('[data-type="famehelsinki/donation-type"]')).toBeVisible()
		await expect(canvas.locator('[data-type="famehelsinki/donation-amounts"]')).toBeVisible()
		await expect(canvas.locator('[data-type="famehelsinki/donation-providers"]')).toBeVisible()
		await expect(canvas.locator('[data-type="famehelsinki/form-controls"]')).toBeVisible()

		// The providers block seeds its attributes from the (mocked) backend;
		// wait for that before saving so the frontend has providers to render.
		await expect
			.poll(async () => {
				const blocks = await editor.getBlocks({ full: true })
				const providers = findBlock(blocks, 'famehelsinki/donation-providers')
				return providers?.attributes?.providers?.length ?? 0
			})
			.toBeGreaterThan(0)

		postId = await editor.publishPost()
		expect(postId).toBeTruthy()
	})

	test('accepts a donation on the frontend', async ({ page }) => {
		const submissions: Record<string, unknown>[] = []

		// Simulate the lahjoitin donation endpoint the browser posts to.
		await page.route('**/donation/e2e-ok*', async route => {
			submissions.push(route.request().postDataJSON())
			await route.fulfill({
				json: { redirect_url: `${process.env.WP_BASE_URL}/?donation=success` },
			})
		})

		await page.goto(`/?p=${postId}`)

		const form = page.locator('form.fame-form--donations')
		await expect(form).toBeVisible()
		await expect(page.locator('.fame-form__notice--warning')).toHaveCount(0)

		// The seeded default provider is auto-selected for the default type.
		await expect(form.locator('input[data-selected-provider]')).toHaveValue('checkout')

		// Choose a preset amount. The radio is visually hidden behind its
		// styled label, so click the label.
		const amountRadio = form.locator('input[name="amount-radio-single"][value="20"]')
		await form.locator('label:has(input[name="amount-radio-single"][value="20"])').click()
		await expect(amountRadio).toBeChecked()

		const submit = form.locator('button[type="submit"]')
		await expect(submit).toBeEnabled()
		await submit.click()

		// The mocked backend redirects to the return address.
		await page.waitForURL('**/?donation=success')

		expect(submissions).toHaveLength(1)
		expect(submissions[0]).toMatchObject({
			type: 'single',
			provider: 'checkout',
			amount: '2000', // cents
		})
	})

	test('disables submission when providers are unavailable', async ({ page, requestUtils }) => {
		await setOrganizationSlug(requestUtils, 'e2e-fail')

		try {
			await page.goto(`/?p=${postId}`)

			await expect(page.locator('.fame-form__notice--warning')).toBeVisible()
			await expect(
				page.locator('form.fame-form--donations input[name="provider"][type="radio"]')
			).toHaveCount(0)
			await expect(
				page.locator('form.fame-form--donations button[type="submit"]')
			).toBeDisabled()
		} finally {
			await setOrganizationSlug(requestUtils, 'e2e-ok')
		}
	})
})

/**
 * Depth-first search for a block by name in the editor block tree.
 */
function findBlock(blocks: any[], name: string): any | undefined {
	for (const block of blocks) {
		if (block.name === name) return block
		const found = findBlock(block.innerBlocks ?? [], name)
		if (found) return found
	}
	return undefined
}
