import { test, expect } from '@wordpress/e2e-test-utils-playwright'
import type { Page } from '@playwright/test'

import {
	createAccessibilityFormPages,
	deleteAccessibilityFormPages,
	type AccessibilityFormPage,
	type AccessibilityFormScenario,
} from './fixtures/accessibility-forms'
import { expectDonationFormToPassAxe } from './helpers/axe'

const formSelector = 'form.fame-form--donations'

async function addFocusMarkerBefore(page: Page, controlSelector: string): Promise<void> {
	await page.locator(controlSelector).evaluate(control => {
		const label = control.closest('label')
		if (!label) throw new Error(`No label found for ${controlSelector}`)

		const marker = document.createElement('button')
		marker.type = 'button'
		marker.dataset.focusMarker = 'true'
		marker.textContent = 'Focus marker'
		label.before(marker)
		marker.focus()
	})
}

async function touchInvalidRequiredContactFields(page: Page, url: string): Promise<void> {
	await page.goto(url)
	const form = page.locator(formSelector)

	await form
		.locator(
			'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
		)
		.click()

	const firstName = form.locator('input[name="first_name"]')
	const lastName = form.locator('input[name="last_name"]')
	const email = form.locator('input[name="email"]')
	await firstName.focus()
	await lastName.focus()
	await email.fill('not-an-email')
	await form.locator('input[name="address"]').focus()
}

test.describe('donation form accessibility', () => {
	let fixtures: Partial<Record<AccessibilityFormScenario, AccessibilityFormPage>> = {}

	test.beforeAll(async ({ requestUtils }) => {
		await requestUtils.rest({
			path: '/wp/v2/settings',
			method: 'POST',
			data: { slug: 'e2e-ok' },
		})
		fixtures = await createAccessibilityFormPages(requestUtils)
	})

	test.afterAll(async ({ requestUtils }) => {
		await deleteAccessibilityFormPages(requestUtils, fixtures)
	})

	test('minimal form has one type, one provider and no contact fields', async ({ page }) => {
		await page.goto(fixtures.minimal!.url)

		const form = page.locator('form.fame-form--donations')
		await expect(form).toBeVisible()
		await expect(form.locator('input[name="type"][type="hidden"]')).toHaveValue('single')
		await expect(form.locator('input[name="provider"][type="radio"]')).toHaveCount(0)
		await expect(form.locator('input[name="provider"][type="hidden"]')).toHaveCount(2)
		await expect(form.locator('.wp-block-famehelsinki-contact-form')).toHaveCount(0)

		await expectDonationFormToPassAxe(page, 'minimal form on initial load')
	})

	test('optional contact form covers both types and the other amount', async ({ page }) => {
		await page.goto(fixtures['optional-contact']!.url)

		const form = page.locator('form.fame-form--donations')
		await expect(form.locator('input[name="type"][type="radio"]')).toHaveCount(2)
		await expect(form.locator('input[name^="amount-"][type="number"]')).toHaveCount(2)

		const contact = form.locator('.wp-block-famehelsinki-contact-form')
		await expect(contact).toBeVisible()
		await expect(contact.locator('input[required]')).toHaveCount(0)
		await expect(contact.locator('input[name="first_name"]')).toBeVisible()
		await expect(contact.locator('input[name="address"]')).toHaveCount(0)
		await expect(contact.locator('input[name="phone"]')).toHaveCount(0)

		await expectDonationFormToPassAxe(page, 'optional contact form on initial load')
	})

	test('all-features form covers campaigns, charge days and required contact details', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)

		const form = page.locator('form.fame-form--donations')
		await expect(form.locator('select[name="campaign"]')).toBeVisible()
		await expect(form.locator('input[name="provider"][type="radio"]')).toHaveCount(2)

		const contact = form.locator('.wp-block-famehelsinki-contact-form')
		await expect(contact.locator('input[required]')).toHaveCount(3)
		await expect(contact.locator('input[name="address"]')).toBeVisible()
		await expect(contact.locator('input[name="phone"]')).toBeVisible()

		const mobilePay = form.locator(
			'fieldset.payment-method-selector:not([hidden]) input[name="provider"][value="mobilepay"]'
		)
		await mobilePay.locator('xpath=ancestor::label').click()
		await expect(mobilePay).toBeChecked()
		await expectDonationFormToPassAxe(
			page,
			'all-features form after selecting a payment provider'
		)

		await form.locator('label:has(input[name="type"][value="recurring"])').click()
		await expect(form.locator('select[name="due_date"]')).toBeVisible()
		await expect(form.locator('select[name="due_date"] option')).toHaveCount(3)

		await expectDonationFormToPassAxe(page, 'all-features form after switching donation type')
	})

	test('Tab reaches controls in logical order and arrow keys change donation type', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)

		await form.evaluate(element => {
			const marker = document.createElement('button')
			marker.type = 'button'
			marker.dataset.focusMarker = 'true'
			marker.textContent = 'Focus marker'
			element.before(marker)
			marker.focus()
		})

		const tabOrder: string[] = []
		for (let index = 0; index < 30; index++) {
			await page.keyboard.press('Tab')
			const focused = await page.evaluate(selector => {
				const currentForm = document.querySelector(selector)
				const active = currentForm?.ownerDocument.activeElement
				if (!(active instanceof HTMLElement) || !currentForm?.contains(active)) return null

				return {
					name: active.getAttribute('name') ?? '',
					type: active.getAttribute('type') ?? active.tagName.toLowerCase(),
					value: active.getAttribute('value') ?? '',
				}
			}, formSelector)

			if (!focused) continue
			tabOrder.push(`${focused.name}:${focused.type}:${focused.value}`)
			if (focused.name === 'provider' && focused.type === 'radio') {
				await page.keyboard.press('Space')
			}
			if (focused.type === 'submit') break
		}

		const positions = {
			type: tabOrder.findIndex(item => item.startsWith('type:radio:')),
			campaign: tabOrder.findIndex(item => item.startsWith('campaign:')),
			amount: tabOrder.findIndex(item => item.startsWith('amount-radio-single:radio:')),
			contact: tabOrder.findIndex(item => item.startsWith('first_name:')),
			provider: tabOrder.findIndex(item => item.startsWith('provider:radio:')),
			submit: tabOrder.findIndex(item => item.includes(':submit:')),
		}

		expect(positions, `Observed tab order: ${tabOrder.join(' -> ')}`).toEqual({
			type: expect.any(Number),
			campaign: expect.any(Number),
			amount: expect.any(Number),
			contact: expect.any(Number),
			provider: expect.any(Number),
			submit: expect.any(Number),
		})
		expect(
			Object.values(positions).every(position => position >= 0),
			`Observed tab order: ${tabOrder.join(' -> ')}`
		).toBe(true)
		expect(Object.values(positions)).toEqual(
			[...Object.values(positions)].sort((a, b) => a - b)
		)

		const single = form.locator('input[name="type"][value="single"]')
		const recurring = form.locator('input[name="type"][value="recurring"]')
		await single.focus()
		await expect(single).toBeFocused()
		await page.keyboard.press('ArrowRight')
		await expect(recurring).toBeChecked()
	})

	for (const focusCase of [
		{
			name: 'donation type',
			selector: `${formSelector} input[name="type"][value="single"]`,
		},
		{
			name: 'donation amount',
			selector: `${formSelector} input[name="amount-radio-single"][value="20"]`,
		},
		{
			name: 'payment provider',
			selector: `${formSelector} fieldset.payment-method-selector:not([hidden]) input[name="provider"][value="checkout"]`,
		},
	]) {
		test(`${focusCase.name} shows a visible indicator on its label`, async ({ page }) => {
			await page.goto(fixtures['all-features']!.url)
			const control = page.locator(focusCase.selector)
			await addFocusMarkerBefore(page, focusCase.selector)
			await page.keyboard.press('Tab')
			await expect(control).toBeFocused()

			const focusStyle = await control.locator('xpath=ancestor::label').evaluate(label => {
				const style = getComputedStyle(label)
				const hasOutline =
					style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
				return {
					boxShadow: style.boxShadow,
					hasVisibleIndicator: hasOutline || style.boxShadow !== 'none',
				}
			})

			expect(focusStyle.hasVisibleIndicator).toBe(true)
			expect(focusStyle.boxShadow).toContain('rgb(255, 255, 255)')
			expect(focusStyle.boxShadow).toContain('rgb(0, 0, 0)')
		})
	}

	test('text fields use the same two-colour focus indicator', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const input = page.locator(`${formSelector} input[name="first_name"]`)
		await input.focus()
		await expect(input).toBeFocused()

		const boxShadow = await input.evaluate(element => getComputedStyle(element).boxShadow)
		expect(boxShadow).toContain('rgb(255, 255, 255)')
		expect(boxShadow).toContain('rgb(0, 0, 0)')
	})

	test('focus indicators remain visible in forced-colors mode', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' })
		await page.goto(fixtures['all-features']!.url)

		for (const selector of [
			`${formSelector} input[name="first_name"]`,
			`${formSelector} input[name="type"][value="single"]`,
		]) {
			const control = page.locator(selector)
			await control.focus()
			const focusTarget = selector.includes('name="type"')
				? control.locator('xpath=ancestor::label')
				: control
			const outline = await focusTarget.evaluate(element => {
				const style = getComputedStyle(element)
				return {
					style: style.outlineStyle,
					width: Number.parseFloat(style.outlineWidth),
				}
			})

			expect(outline.style).not.toBe('none')
			expect(outline.width).toBeGreaterThanOrEqual(3)
		}

		const selectedLabel = page
			.locator(`${formSelector} input[name="type"][value="single"]:checked`)
			.locator('xpath=ancestor::label')
		const selectedStyle = await selectedLabel.evaluate(element => {
			const style = getComputedStyle(element)
			return {
				background: style.backgroundColor,
				color: style.color,
				borderWidth: Number.parseFloat(style.borderTopWidth),
				marker: getComputedStyle(element, '::before').content,
			}
		})
		const unselectedStyle = await page
			.locator(`${formSelector} input[name="type"][value="recurring"]`)
			.locator('xpath=ancestor::label')
			.evaluate(element => {
				const style = getComputedStyle(element)
				return { background: style.backgroundColor, color: style.color }
			})
		const systemColors = await page.evaluate(() => {
			const reference = document.createElement('span')
			reference.style.backgroundColor = 'Highlight'
			reference.style.color = 'GrayText'
			document.body.appendChild(reference)
			const style = getComputedStyle(reference)
			const colors = { highlight: style.backgroundColor, grayText: style.color }
			reference.remove()
			return colors
		})
		expect(selectedStyle.background).toBe(systemColors.highlight)
		expect(selectedStyle.background).not.toBe(unselectedStyle.background)
		expect(selectedStyle.color).not.toBe(unselectedStyle.color)
		expect(selectedStyle.borderWidth).toBeGreaterThanOrEqual(3)
		expect(selectedStyle.marker).toContain('✓')
		await expect(selectedLabel.locator('input[type="radio"]')).toHaveAccessibleName(/^[^✓]+$/)

		const inactiveSubmitStyle = await page
			.locator(`${formSelector} button[aria-disabled="true"]`)
			.evaluate(element => {
				const style = getComputedStyle(element)
				return { color: style.color, borderColor: style.borderTopColor }
			})
		expect(inactiveSubmitStyle.color).toBe(systemColors.grayText)
		expect(inactiveSubmitStyle.borderColor).toBe(systemColors.grayText)
	})

	test('field errors and one live announcer exist before validation runs', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const contact = page.locator(`${formSelector} .wp-block-famehelsinki-contact-form`)
		const contactInputs = contact.locator('input')
		const errors = contact.locator('.fame-form__feedback')
		const announcer = form.locator('.fame-form__validation-announcer[aria-live="polite"]')

		expect(await contactInputs.count()).toBeGreaterThan(0)
		await expect(errors).toHaveCount(await contactInputs.count())
		await expect(announcer).toHaveCount(1)
		expect(
			await errors.evaluateAll(regions =>
				regions.every(region => !region.hasAttribute('aria-live'))
			)
		).toBe(true)
		expect(
			await errors.evaluateAll(regions =>
				regions.every(region => getComputedStyle(region).display !== 'none')
			)
		).toBe(true)
	})

	test('submit status describes the button without making live announcements', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const submit = form.locator('button[type="submit"]')
		const statusId = await submit.getAttribute('aria-describedby')
		const status = form.locator(`#${statusId}`)

		await expect(status).toHaveText('The form has incomplete or invalid fields.')
		await expect(status).not.toHaveAttribute('aria-live')
	})

	test('untouched required fields do not receive native invalid events during readiness checks', async ({
		page,
	}) => {
		await page.addInitScript(() => {
			document.addEventListener(
				'invalid',
				() => {
					const root = document.documentElement
					root.dataset.invalidEvents = String(Number(root.dataset.invalidEvents ?? 0) + 1)
				},
				true
			)
		})
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const firstName = form.locator('input[name="first_name"]')
		const provider = form
			.locator('fieldset.payment-method-selector:not([hidden]) input[name="provider"]')
			.first()
		await firstName.focus()
		await expect(firstName).toHaveAttribute('aria-invalid', 'false')
		await expect(form.locator('button[type="submit"]')).toHaveAttribute('aria-disabled', 'true')
		await provider.focus()
		await expect(provider).toHaveAttribute('aria-invalid', 'false')
		await expect(provider).toHaveAttribute('required', '')
		await expect(firstName).toHaveAttribute('aria-invalid', 'true')
		await expect(page.locator('html')).not.toHaveAttribute('data-invalid-events')
	})

	test('contact fields expose errors only after blur and reset the explicit state after correction', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		for (const [name, value] of [
			['first_name', 'Ada'],
			['last_name', 'Lovelace'],
			['email', 'ada@example.com'],
		]) {
			const field = form.locator(`input[name="${name}"]`)
			await field.focus()
			await expect(field).toHaveAttribute('aria-invalid', 'false')
			if (name === 'email') {
				await field.pressSequentially('ada@')
				await expect(field).toHaveAttribute('aria-invalid', 'false')
			}
			await form.locator('button[type="submit"]').focus()
			await expect(field).toHaveAttribute('aria-invalid', 'true')
			await field.fill(value)
			await expect(field).toHaveAttribute('aria-invalid', 'false')
		}
	})

	test('each invalid contact field has its own error message', async ({ page }) => {
		await touchInvalidRequiredContactFields(page, fixtures['all-features']!.url)
		const form = page.locator(formSelector)

		await expect(form.locator('.fame-form__feedback--invalid')).toHaveCount(3)

		const firstName = form.locator('input[name="first_name"]')
		await firstName.fill('Ada')
		await expect(firstName).toHaveAttribute('aria-invalid', 'false')
		await expect(form.locator('.fame-form__feedback--invalid')).toHaveCount(2)
	})

	test('invalid contact fields expose aria-invalid and linked errors', async ({ page }) => {
		await touchInvalidRequiredContactFields(page, fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const invalidFields = [
			form.locator('input[name="first_name"]'),
			form.locator('input[name="last_name"]'),
			form.locator('input[name="email"]'),
		]

		for (const field of invalidFields) {
			await expect(field).toHaveAttribute('aria-invalid', 'true')
			const describedBy = (await field.getAttribute('aria-describedby'))?.split(/\s+/) ?? []
			expect(describedBy.length).toBeGreaterThan(0)

			const linkedErrors = (
				await Promise.all(
					describedBy.map(async id => ({
						id,
						count: await form.locator(`#${id}.fame-form__feedback--invalid`).count(),
					}))
				)
			).filter(reference => reference.count > 0)
			expect(linkedErrors.length).toBeGreaterThan(0)
		}
	})

	test('axe passes after field-level validation errors are shown', async ({ page }) => {
		await touchInvalidRequiredContactFields(page, fixtures['all-features']!.url)
		await expect(page.locator(`${formSelector} .fame-form__feedback--invalid`)).toHaveCount(3)

		await expectDonationFormToPassAxe(page, 'all-features form with validation errors')
	})

	test('other amount exposes its current currency value across edits and type changes', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const amount = form.locator('.donation-amounts__other:visible input[type="number"]')
		await expect(amount).toHaveAttribute('aria-valuetext', '20 €')
		await amount.fill('25')
		await expect(amount).toHaveAttribute('aria-valuetext', '25 €')
		await amount.fill('4')
		await expect(amount).toHaveAttribute('aria-valuetext', '4 €')
		await expect(amount).toHaveAttribute('aria-invalid', 'true')
		await form.locator('label:has(input[name="amount-radio-single"][value="50"])').click()
		await expect(amount).toHaveAttribute('aria-valuetext', '50 €')
		await form.locator('label:has(input[name="type"][value="recurring"])').click()
		await expect(amount).toHaveAttribute('aria-valuetext', '10 €')
		await form.locator('label:has(input[name="type"][value="single"])').click()
		await expect(amount).toHaveAttribute('aria-valuetext', '50 €')
	})

	test('an invalid other amount is immediately linked to its error message', async ({ page }) => {
		await page.goto(fixtures['optional-contact']!.url)
		const form = page.locator(formSelector)
		const amount = form.locator('.donation-amounts__other:visible input[type="number"]')

		await amount.fill('4')
		await expect(amount).toHaveAttribute('aria-invalid', 'true')

		const describedBy = (await amount.getAttribute('aria-describedby'))?.split(/\s+/) ?? []
		const linkedError = form.locator(`#${describedBy.at(-1)}`)
		await expect(linkedError).not.toBeEmpty()
		await expect(linkedError).not.toHaveAttribute('aria-live')
		await expect(form.locator('.fame-form__validation-announcer')).toBeEmpty()

		await form.locator('input[name="first_name"]').focus()
		await expect(form.locator('.fame-form__validation-announcer')).toContainText(
			'The minimum donation amount'
		)

		await amount.fill('5')
		await expect(amount).not.toHaveAttribute('aria-invalid')
		await expect(linkedError).toBeEmpty()
		await expect(form.locator('.fame-form__validation-announcer')).toBeEmpty()
	})

	test('typing a valid amount digit by digit does not announce a temporary error', async ({
		page,
	}) => {
		await page.goto(fixtures['optional-contact']!.url)
		const form = page.locator(formSelector)
		const amount = form.locator('.donation-amounts__other:visible input[type="number"]')
		const announcer = form.locator('.fame-form__validation-announcer')

		await amount.fill('')
		await amount.pressSequentially('25')

		await expect(amount).toHaveValue('25')
		await expect(amount).not.toHaveAttribute('aria-invalid')
		await expect(announcer).toBeEmpty()
	})

	test('submit stays focusable and aria-disabled until the form is valid', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const submit = form.locator('button[type="submit"]')

		await expect(submit).not.toHaveAttribute('disabled', '')
		await expect(submit).toHaveAttribute('aria-disabled', 'true')
		await submit.focus()
		await expect(submit).toBeFocused()

		const descriptionId = await submit.getAttribute('aria-describedby')
		expect(descriptionId).toBeTruthy()
		await expect(form.locator(`#${descriptionId}`)).not.toBeEmpty()

		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')

		await expect(submit).toHaveAttribute('aria-disabled', 'false')
	})

	for (const method of ['click', 'Enter'] as const) {
		test(`an incomplete submission by ${method} exposes errors and focuses the first invalid field`, async ({
			page,
		}) => {
			await page.goto(fixtures['all-features']!.url)
			const form = page.locator(formSelector)
			const submit = form.locator('button[type="submit"]')
			const firstName = form.locator('input[name="first_name"]')

			if (method === 'click') {
				// Playwright treats aria-disabled like native disabled for actionability,
				// although browsers still dispatch pointer clicks for this button.
				await submit.click({ force: true })
			} else {
				await submit.focus()
				await page.keyboard.press('Enter')
			}

			await expect(firstName).toBeFocused()
			await expect(firstName).toHaveAttribute('aria-invalid', 'true')
			await expect(form.locator('.fame-form__feedback--invalid')).not.toHaveCount(0)

			const providerFieldset = form.locator('fieldset.payment-method-selector:not([hidden])')
			const providerFeedback = providerFieldset.locator(
				'.fame-form__feedback[data-validation-for="provider"]'
			)
			await expect(providerFeedback).toHaveCount(1)
			await expect(providerFeedback).toHaveText('Choose a payment method')
			const feedbackId = await providerFeedback.getAttribute('id')
			for (const radio of await providerFieldset.locator('input[type="radio"]').all()) {
				await expect(radio).toHaveAttribute('aria-describedby', feedbackId!)
			}
		})
	}

	test('Enter in a text field uses the same accessible submit validation', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const firstName = form.locator('input[name="first_name"]')

		await firstName.focus()
		await page.keyboard.press('Enter')

		await expect(firstName).toBeFocused()
		await expect(firstName).toHaveAttribute('aria-invalid', 'true')
		await expect(form.locator('.fame-form__feedback--invalid')).not.toHaveCount(0)
	})

	test('Enter announces the invalid amount when focus is already on that field', async ({
		page,
	}) => {
		await page.goto(fixtures['optional-contact']!.url)
		const form = page.locator(formSelector)
		const amount = form.locator('.donation-amounts__other:visible input[type="number"]')
		const announcer = form.locator('.fame-form__validation-announcer')

		await amount.fill('4')
		await expect(announcer).toBeEmpty()
		await amount.press('Enter')

		await expect(amount).toBeFocused()
		const errorId = (await amount.getAttribute('aria-describedby'))?.split(/\s+/).at(-1)
		const error = form.locator(`#${errorId}`)
		const label = await amount.evaluate(control => control.labels?.[0]?.textContent?.trim())
		await expect(announcer).toHaveText(`${label}: ${(await error.textContent())?.trim()}`)

		await amount.press('Enter')
		await expect(amount).toBeFocused()
		await expect(announcer).toHaveText(`${label}: ${(await error.textContent())?.trim()}`)

		await amount.fill('5')
		await expect(announcer).toBeEmpty()
		await expect(amount).not.toHaveAttribute('aria-invalid')
	})

	test('Enter announces an invalid email when focus is already on that field', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		const email = form.locator('input[name="email"]')
		const announcer = form.locator('.fame-form__validation-announcer')

		await email.fill('ada@')
		await expect(announcer).toBeEmpty()
		await email.press('Enter')

		await expect(email).toBeFocused()
		const errorId = (await email.getAttribute('aria-describedby'))?.split(/\s+/).at(-1)
		const error = form.locator(`#${errorId}`)
		const label = await email.evaluate(control => control.labels?.[0]?.textContent?.trim())
		await expect(announcer).toHaveText(`${label}: ${(await error.textContent())?.trim()}`)

		await email.press('Enter')
		await expect(email).toBeFocused()
		await expect(announcer).toHaveText(`${label}: ${(await error.textContent())?.trim()}`)
		await expect
			.poll(() => announcer.textContent())
			.toBe(`${label}: ${(await error.textContent())?.trim()}\u00a0`)

		await email.press('Enter')
		await expect
			.poll(() => announcer.textContent())
			.toBe(`${label}: ${(await error.textContent())?.trim()}`)

		await email.fill('ada@example.com')
		await expect(announcer).toBeEmpty()
		await expect(email).toHaveAttribute('aria-invalid', 'false')
	})

	test('Enter announces the radio group and choosing another option clears its error', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')
		const group = form.locator('fieldset.payment-method-selector:not([hidden])')
		const radios = group.locator('input[type="radio"]')
		const announcer = form.locator('.fame-form__validation-announcer')
		await form.locator('input[name="phone"]').focus()
		await page.keyboard.press('Tab')
		await expect(radios.first()).toBeFocused()
		await expect(group.locator('input:checked')).toHaveCount(0)

		await page.keyboard.press('Enter')
		await expect(radios.first()).toBeFocused()
		await expect(announcer).toHaveText('Payment method: Choose a payment method')

		await page.keyboard.press('Enter')
		await expect(announcer).toHaveText('Payment method: Choose a payment method')

		await page.keyboard.press('ArrowRight')
		await expect(radios.nth(1)).toBeChecked()
		await expect(radios.nth(1)).toBeFocused()
		await expect(announcer).toBeEmpty()
		await expect(group.locator('[aria-invalid="true"]')).toHaveCount(0)
		await expect(group.locator('.fame-form__feedback')).toBeEmpty()
	})

	test('submitting from outside the payment group announces its correction instruction', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')
		// aria-disabled blocks Playwright's default click, but not browser clicks.
		await form.locator('button[type="submit"]').click({ force: true })
		await expect(
			form
				.locator('fieldset.payment-method-selector:not([hidden]) input[type="radio"]')
				.first()
		).toBeFocused()
		await expect(form.locator('.fame-form__validation-announcer')).toHaveText(
			'Payment method: Choose a payment method'
		)
	})

	test('changing donation type clears an announcement for the hidden payment group', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')
		const singleProviders = form.locator('fieldset.payment-method-selector[data-type="single"]')
		const firstProvider = singleProviders.locator('input[type="radio"]').first()
		const announcer = form.locator('.fame-form__validation-announcer')
		await firstProvider.focus()
		await firstProvider.press('Enter')
		await expect(announcer).toHaveText('Payment method: Choose a payment method')

		const singleType = form.locator('input[name="type"][value="single"]')
		await singleType.focus()
		await singleType.press('ArrowRight')
		await expect(form.locator('input[name="type"][value="recurring"]')).toBeChecked()
		await expect(singleProviders).toBeHidden()
		await expect(firstProvider).toBeDisabled()
		await expect(form.locator('input[data-selected-provider]')).toHaveValue('checkout')
		await expect(announcer).toBeEmpty()
		await expect(form.locator('button[type="submit"]')).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	})

	test('correcting email preserves a newer amount announcement', async ({ page }) => {
		await page.goto(fixtures['optional-contact']!.url)
		const form = page.locator(formSelector)
		const email = form.locator('input[name="email"]')
		const amount = form.locator('.donation-amounts__other:visible input[type="number"]')
		const announcer = form.locator('.fame-form__validation-announcer')

		await email.fill('ada@')
		await email.press('Enter')
		await expect(email).toBeFocused()
		await expect(announcer).toContainText('Invalid email')
		await amount.fill('4')
		await email.focus()
		await expect(announcer).toContainText('Other amount: The minimum donation amount')
		const amountMessage = await announcer.textContent()

		await email.fill('ada@example.com')
		await expect(email).toHaveAttribute('aria-invalid', 'false')
		await expect(announcer).toHaveText(amountMessage!)

		await amount.fill('5')
		await expect(announcer).toBeEmpty()
		await expect(amount).not.toHaveAttribute('aria-invalid')
	})

	test('an invalid other amount from a hidden donation type does not block submission', async ({
		page,
	}) => {
		await page.goto(fixtures['optional-contact']!.url)
		const form = page.locator(formSelector)
		const single = form.locator('input[name="type"][value="single"]')
		const recurring = form.locator('input[name="type"][value="recurring"]')

		await single.locator('xpath=ancestor::label').click()
		const singleOther = form.locator(
			'.donation-amounts__other[data-type="single"] input[type="number"]'
		)
		await singleOther.fill('4')
		await expect(singleOther).toHaveAttribute('aria-invalid', 'true')

		await recurring.locator('xpath=ancestor::label').click()

		await expect(singleOther).toBeDisabled()
		await expect(form.locator('button[type="submit"]')).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	})

	test('a late validation error moves focus to the first invalid field', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')

		await page.evaluate(() => {
			window.addEventListener(
				'fame-lahjoitukset-submit',
				(event: Event) => {
					const submission = event as CustomEvent<{ errors: Record<string, string> }>
					submission.detail.errors.first_name = 'Check the first name'
				},
				{ once: true }
			)
		})

		await form.locator('button[type="submit"]').click()
		await expect(form.locator('input[name="first_name"]')).toBeFocused()
	})

	test('an integration amount error is linked to the visible amount choice', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')
		await page.evaluate(() => {
			window.addEventListener(
				'fame-lahjoitukset-submit',
				(event: Event) => {
					const submission = event as CustomEvent<{ errors: Record<string, string> }>
					submission.detail.errors.amount = 'Check the donation amount'
				},
				{ once: true }
			)
		})

		await form.locator('button[type="submit"]').click()

		const selectedAmount = form.locator('.donation-amounts:visible input[type="radio"]:checked')
		await expect(selectedAmount).toBeFocused()
		await expect(selectedAmount).toHaveAttribute('aria-invalid', 'true')
		const errorId = (await selectedAmount.getAttribute('aria-describedby'))?.split(/\s+/).at(-1)
		await expect(form.locator(`#${errorId}`)).toHaveText('Check the donation amount')
		const amountGroup = form.locator('.donation-amounts:visible')
		for (const radio of await amountGroup.locator('input[type="radio"]').all()) {
			await expect(radio).toHaveAttribute('aria-describedby', errorId!)
		}
		const errorWidth = await form
			.locator(`#${errorId}`)
			.evaluate(element => element.getBoundingClientRect().width)
		const groupWidth = await amountGroup.evaluate(
			element => element.getBoundingClientRect().width
		)
		expect(errorWidth).toBeGreaterThan(groupWidth * 0.9)
	})

	test('hidden-provider and unknown integration errors use the form-level alert', async ({
		page,
	}) => {
		await page.goto(fixtures.minimal!.url)
		const form = page.locator(formSelector)
		await page.evaluate(() => {
			window.addEventListener(
				'fame-lahjoitukset-submit',
				(event: Event) => {
					const submission = event as CustomEvent<{ errors: Record<string, string> }>
					submission.detail.errors.provider = 'Payment method unavailable'
					submission.detail.errors.integration_field = 'Integration rejected the donation'
				},
				{ once: true }
			)
		})

		await form.locator('button[type="submit"]').click()

		await expect(form.locator('.fame-form__submission-error[role="alert"]')).toHaveText(
			'Payment method unavailable Integration rejected the donation'
		)
		await expect(form).not.toHaveClass(/fame-form--submitting/)
		await expect(form.locator('button[type="submit"]')).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	})

	test('a backend validation error moves focus without disabling the submit button', async ({
		page,
	}) => {
		await page.route('**/donation/e2e-ok*', async route => {
			await route.fulfill({
				status: 422,
				contentType: 'application/json',
				body: JSON.stringify({
					message: 'Invalid form',
					error: { email: 'Check the email address' },
				}),
			})
		})
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')

		const submit = form.locator('button[type="submit"]')
		await submit.click()

		await expect(form.locator('input[name="email"]')).toBeFocused()
		await expect(submit).not.toHaveAttribute('disabled', '')
		await expect(form.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true')
	})

	test('a server failure is announced without removing focus from submit', async ({ page }) => {
		await page.route('**/donation/e2e-ok*', async route => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Temporary failure' }),
			})
		})
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		await form
			.locator(
				'fieldset.payment-method-selector:not([hidden]) label:has(input[name="provider"][value="checkout"])'
			)
			.click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')

		const submit = form.locator('button[type="submit"]')
		await submit.click()

		await expect(submit).toBeFocused()
		await expect(form.locator('.fame-form__submission-error[role="alert"]')).toHaveText(
			'The donation could not be submitted. Please try again.'
		)
	})

	test('changing a radio clears an external error from the complete provider group', async ({
		page,
	}) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const checkout = form.locator(
			'fieldset.payment-method-selector:not([hidden]) input[name="provider"][value="checkout"]'
		)
		const mobilePay = form.locator(
			'fieldset.payment-method-selector:not([hidden]) input[name="provider"][value="mobilepay"]'
		)
		await checkout.locator('xpath=ancestor::label').click()
		await form.locator('input[name="first_name"]').fill('Ada')
		await form.locator('input[name="last_name"]').fill('Lovelace')
		await form.locator('input[name="email"]').fill('ada@example.com')
		await page.evaluate(() => {
			window.addEventListener(
				'fame-lahjoitukset-submit',
				(event: Event) => {
					const submission = event as CustomEvent<{ errors: Record<string, string> }>
					submission.detail.errors.provider = 'Choose another payment method'
				},
				{ once: true }
			)
		})

		await form.locator('button[type="submit"]').click()
		await expect(checkout).toHaveAttribute('aria-invalid', 'true')

		await mobilePay.locator('xpath=ancestor::label').click()
		await expect(form.locator('input[name="provider"][aria-invalid="true"]')).toHaveCount(0)
		expect(
			await form
				.locator('input[name="provider"]')
				.evaluateAll(inputs =>
					inputs.every(input => !(input as HTMLInputElement).validity.customError)
				)
		).toBe(true)
		await expect(form.locator('button[type="submit"]')).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	})

	test('every aria-describedby and aria-labelledby reference exists', async ({ page }) => {
		for (const scenario of Object.keys(fixtures) as AccessibilityFormScenario[]) {
			await page.goto(fixtures[scenario]!.url)
			const missingReferences = await page.locator(formSelector).evaluate(form => {
				const missing: string[] = []
				for (const element of form.querySelectorAll(
					'[aria-describedby], [aria-labelledby]'
				)) {
					for (const attribute of ['aria-describedby', 'aria-labelledby']) {
						const ids = element.getAttribute(attribute)?.trim().split(/\s+/) ?? []
						for (const id of ids) {
							if (id && !document.getElementById(id)) {
								missing.push(
									`${attribute}="${id}" on #${element.id || element.tagName}`
								)
							}
						}
					}
				}
				return missing
			})

			expect(missingReferences, `${scenario} has dangling ARIA references`).toEqual([])
		}
	})

	test('contact fields expose the expected autocomplete purposes', async ({ page }) => {
		await page.goto(fixtures['all-features']!.url)
		const form = page.locator(formSelector)
		const expectedAutocomplete = {
			first_name: 'given-name',
			last_name: 'family-name',
			email: 'email',
			address: 'street-address',
			city: 'address-level2',
			postal_code: 'postal-code',
			phone: 'tel',
		}

		for (const [name, autocomplete] of Object.entries(expectedAutocomplete)) {
			await expect(form.locator(`input[name="${name}"]`)).toHaveAttribute(
				'autocomplete',
				autocomplete
			)
		}
	})

	test('all-features form has no horizontal overflow at 320px', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 900 })
		await page.goto(fixtures['all-features']!.url)

		const dimensions = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
		}))
		expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
		await expectDonationFormToPassAxe(page, 'all-features form at 320px width')
	})

	test('interactive targets meet the WCAG 2.2 minimum size at 320px', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 900 })
		await page.goto(fixtures['all-features']!.url)

		const undersizedTargets = await page.locator(formSelector).evaluate(form => {
			return Array.from(
				form.querySelectorAll<HTMLElement>(
					'input:not([type="hidden"]), select, textarea, button'
				)
			)
				.filter(element => {
					const rect = element.getBoundingClientRect()
					const style = getComputedStyle(element)
					return (
						!element.matches(':disabled') &&
						style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						rect.width > 0 &&
						rect.height > 0
					)
				})
				.map(element => element.closest<HTMLElement>('label') ?? element)
				.map(element => {
					const rect = element.getBoundingClientRect()
					return {
						target: element.getAttribute('for') ?? element.id ?? element.tagName,
						width: rect.width,
						height: rect.height,
					}
				})
				.filter(({ width, height }) => width < 24 || height < 24)
		})

		expect(undersizedTargets).toEqual([])
	})

	test('form content remains available when text size is increased to 200%', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 })
		await page.goto(fixtures['all-features']!.url)
		await page.evaluate(() => {
			document.documentElement.style.fontSize = '200%'
		})
		const form = page.locator(formSelector)

		const layout = await form.evaluate(element => {
			const clippedText = Array.from(
				element.querySelectorAll<HTMLElement>(
					'label, button, legend, .fame-form__help, .fame-form__submit-status'
				)
			)
				.filter(item => {
					const style = getComputedStyle(item)
					return style.display !== 'none' && style.visibility !== 'hidden'
				})
				.filter(
					item =>
						item.scrollWidth > item.clientWidth + 1 ||
						item.scrollHeight > item.clientHeight + 1
				)
				.map(item => item.textContent?.trim() ?? item.tagName)

			return {
				clippedText,
				documentOverflow:
					document.documentElement.scrollWidth - document.documentElement.clientWidth,
			}
		})

		expect(layout.clippedText).toEqual([])
		expect(layout.documentOverflow).toBeLessThanOrEqual(0)
	})
})
