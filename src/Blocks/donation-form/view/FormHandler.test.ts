import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals'
import FormHandler from './FormHandler'
import { ErrorTranslations } from './Validation.ts'
import { FormResultEvent, FormSubmitEvent } from './Events.ts'

describe('FormHandler', () => {
	let form: HTMLFormElement, mockTranslations: ErrorTranslations

	beforeEach(() => {
		document.body.innerHTML = `
            <form action="/submit">
                <input type="hidden" name="amount" value="1000">
                <button type="submit">Submit</button>
            </form>
        `

		form = document.querySelector('form')!
		mockTranslations = {}
	})

	test('should attach event listener for form submission', () => {
		jest.spyOn(form, 'addEventListener')

		new FormHandler('/submit', 'my-org', form, mockTranslations)
		expect(form.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function))
	})

	test('keeps submit focusable but aria-disabled when no payment provider is available', () => {
		new FormHandler('/submit', 'my-org', form, mockTranslations)

		const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
		expect(submit.disabled).toBe(false)
		expect(submit.getAttribute('aria-disabled')).toBe('true')
	})

	test('keeps submit aria-disabled when amount changes without an available provider', () => {
		document.body.innerHTML = `
			<form action="/submit">
				<input type="hidden" name="amount" value="1000">
				<div class="donation-amounts">
					<input name="amount-single" type="number" min="1" value="10">
				</div>
				<button type="submit">Submit</button>
			</form>
		`
		form = document.querySelector('form')!
		new FormHandler('/submit', 'my-org', form, mockTranslations)

		const amount = form.querySelector<HTMLInputElement>('input[type="number"]')!
		const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!

		amount.value = '20'
		amount.dispatchEvent(new Event('input', { bubbles: true }))

		expect(submit.disabled).toBe(false)
		expect(submit.getAttribute('aria-disabled')).toBe('true')
	})

	test('getSubmitUrl includes the backend host and slug', () => {
		const handler = new FormHandler(
			'https://api.lahjoitin.fi',
			'my-org',
			form,
			mockTranslations
		)
		const url = handler.getSubmitUrl()

		expect(url.toString()).toBe('https://api.lahjoitin.fi/donation/my-org')
	})

	test('getSubmitUrl url-encodes the slug', () => {
		const handler = new FormHandler(
			'https://api.lahjoitin.fi',
			'my org/x',
			form,
			mockTranslations
		)
		const url = handler.getSubmitUrl()

		expect(url.pathname).toBe('/donation/my%20org%2Fx')
	})

	test('getSubmitUrl appends contact query param', () => {
		document.body.innerHTML = `
            <form action="/submit">
                <input type="hidden" name="amount" value="1000">
                <div data-contact="1"></div>
                <button type="submit">Submit</button>
            </form>
        `
		form = document.querySelector('form')!

		const handler = new FormHandler(
			'https://api.lahjoitin.fi',
			'my-org',
			form,
			mockTranslations
		)
		const url = handler.getSubmitUrl()

		expect(url.pathname).toBe('/donation/my-org')
		expect(url.searchParams.get('contact')).toBe('1')
	})
})

describe('FormHandler events', () => {
	let form: HTMLFormElement
	let handler: FormHandler

	// Track listeners so they can be removed after each test — window event
	// listeners are global and would otherwise leak across specs.
	let listeners: Array<[string, EventListener]> = []

	const on = (type: string, listener: EventListener) => {
		window.addEventListener(type, listener)
		listeners.push([type, listener])
	}

	// Submit the form the way a user click would, in a jsdom-friendly way.
	const submit = () =>
		form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

	// Let the async #onSubmit microtask chain (and any awaited fetch) settle.
	const flush = () => new Promise(resolve => setTimeout(resolve, 0))

	beforeEach(() => {
		document.body.innerHTML = `
            <form class="fame-form fame-form--donations" novalidate>
                <input type="hidden" name="amount" value="1000" />
				<div class="donation-amounts" data-type="single">
					<label><input id="amount-choice" type="radio" value="10" checked />10</label>
				</div>
				<input type="radio" name="type" value="single" checked />
				<input type="radio" name="type" value="recurring" />
                <fieldset class="payment-method-selector fame-form__fieldset" data-type="single">
                    <div class="fame-form__group" data-type="single">
                        <label>
                            <input type="radio" name="provider" value="stripe" data-type="single" required />
                        </label>
                    </div>
                </fieldset>
				<fieldset class="payment-method-selector fame-form__fieldset" data-type="recurring">
					<input type="hidden" name="provider" value="mobilepay" data-type="recurring" disabled />
				</fieldset>
				<div data-recurring-due-date hidden aria-hidden="true">
					<select name="due_date" data-recurring-due-date-input required disabled>
						<option value="21" selected>21</option>
					</select>
				</div>
                <div class="fame-form__fieldset">
                    <input type="text" name="email" />
                </div>
                <input type="hidden" name="provider" data-selected-provider />
				<p class="fame-form__submission-error" role="alert"></p>
                <button type="submit">Submit</button>
            </form>
        `

		form = document.querySelector('form')!
		handler = new FormHandler('https://api.lahjoitin.fi', 'my-org', form)
	})

	afterEach(() => {
		listeners.forEach(([type, listener]) => window.removeEventListener(type, listener))
		listeners = []
		jest.restoreAllMocks()
		delete (globalThis as any).fetch
	})

	test('dispatches fame-lahjoitukset-submit with the documented detail', () => {
		let captured: FormSubmitEvent | undefined

		on('fame-lahjoitukset-submit', (event: Event) => {
			captured = event as FormSubmitEvent
			// Cancel so the request is never sent during this assertion-only test.
			event.preventDefault()
		})

		submit()

		expect(captured).toBeDefined()
		expect(captured!.detail.data).toEqual({
			amount: '1000',
			type: 'single',
			provider: 'stripe',
			email: '',
		})
		expect(captured!.detail.handler).toBe(handler)
		expect(captured!.detail.errors).toEqual({})
		expect(captured!.detail.url).toBeInstanceOf(URL)
		expect(captured!.detail.url.toString()).toBe('https://api.lahjoitin.fi/donation/my-org')
	})

	test('submits due_date only when recurring donation is selected', () => {
		let captured: FormSubmitEvent | undefined
		on('fame-lahjoitukset-submit', (event: Event) => {
			captured = event as FormSubmitEvent
			event.preventDefault()
		})

		const recurring = form.querySelector<HTMLInputElement>(
			'input[name="type"][value="recurring"]'
		)!
		recurring.checked = true
		recurring.dispatchEvent(new Event('change', { bubbles: true }))

		const section = form.querySelector<HTMLElement>('[data-recurring-due-date]')!
		const dueDate = form.querySelector<HTMLSelectElement>('[name="due_date"]')!
		expect(section.hidden).toBe(false)
		expect(dueDate.disabled).toBe(false)

		submit()

		expect(captured?.detail.data).toMatchObject({
			type: 'recurring',
			provider: 'mobilepay',
			due_date: '21',
		})
	})

	test('submits the hidden due_date input only for recurring donations', () => {
		// Fewer than two configured days render a bare hidden input instead of
		// the selector, but the recurring-only rule must still hold.
		form.querySelector('[data-recurring-due-date]')!.outerHTML =
			'<input type="hidden" name="due_date" value="5" data-recurring-due-date-input disabled />'
		handler = new FormHandler('https://api.lahjoitin.fi', 'my-org', form)

		let captured: FormSubmitEvent | undefined
		on('fame-lahjoitukset-submit', (event: Event) => {
			captured = event as FormSubmitEvent
			event.preventDefault()
		})

		const dueDate = form.querySelector<HTMLInputElement>('[name="due_date"]')!
		expect(dueDate.disabled).toBe(true)

		submit()
		expect(captured?.detail.data).not.toHaveProperty('due_date')

		const recurring = form.querySelector<HTMLInputElement>(
			'input[name="type"][value="recurring"]'
		)!
		recurring.checked = true
		recurring.dispatchEvent(new Event('change', { bubbles: true }))
		expect(dueDate.disabled).toBe(false)

		submit()

		expect(captured?.detail.data).toMatchObject({
			type: 'recurring',
			due_date: '5',
		})
	})

	test('preventDefault() on the submit event cancels submission', async () => {
		const fetchMock = jest.fn()
		;(globalThis as any).fetch = fetchMock

		on('fame-lahjoitukset-submit', (event: Event) => event.preventDefault())

		submit()
		await flush()

		expect(fetchMock).not.toHaveBeenCalled()
	})

	test('an incomplete submission exposes errors and focuses the first invalid field', () => {
		const requiredGroup = document.createElement('div')
		requiredGroup.className = 'fame-form__group'
		requiredGroup.innerHTML = '<input id="last-name" name="last_name" required />'
		form.querySelector('[type="submit"]')!.before(requiredGroup)

		const lastName = form.querySelector<HTMLInputElement>('[name="last_name"]')!
		submit()

		expect(lastName.getAttribute('aria-invalid')).toBe('true')
		expect(form.ownerDocument.activeElement).toBe(lastName)
	})

	test('listener-populated detail.errors blocks submission', async () => {
		const fetchMock = jest.fn()
		;(globalThis as any).fetch = fetchMock

		on('fame-lahjoitukset-submit', (event: Event) => {
			;(event as FormSubmitEvent).detail.errors = { email: 'Invalid email' }
		})

		submit()
		await flush()

		expect(fetchMock).not.toHaveBeenCalled()

		const email = form.querySelector<HTMLInputElement>('input[name="email"]')!
		expect(email.validity.customError).toBe(true)
		expect(email.validationMessage).toBe('Invalid email')

		const feedback = form.querySelector('.fame-form__feedback--invalid')
		expect(feedback?.textContent).toBe('Invalid email')
	})

	test('maps an integration amount error to the visible amount control', async () => {
		const fetchMock = jest.fn()
		;(globalThis as any).fetch = fetchMock

		on('fame-lahjoitukset-submit', (event: Event) => {
			;(event as FormSubmitEvent).detail.errors = { amount: 'Check the donation amount' }
		})

		submit()
		await flush()

		const amount = form.querySelector<HTMLInputElement>('#amount-choice')!
		expect(fetchMock).not.toHaveBeenCalled()
		expect(amount.getAttribute('aria-invalid')).toBe('true')
		expect(form.ownerDocument.activeElement).toBe(amount)
		expect(form.querySelector('.donation-amounts__error')?.textContent).toBe(
			'Check the donation amount'
		)
	})

	test('shows hidden-provider and unknown integration errors at form level', async () => {
		const fetchMock = jest.fn()
		;(globalThis as any).fetch = fetchMock

		const recurring = form.querySelector<HTMLInputElement>(
			'input[name="type"][value="recurring"]'
		)!
		recurring.checked = true
		recurring.dispatchEvent(new Event('change', { bubbles: true }))

		on('fame-lahjoitukset-submit', (event: Event) => {
			;(event as FormSubmitEvent).detail.errors = {
				provider: 'This payment method is unavailable',
				integration_field: 'The integration rejected this donation',
			}
		})

		submit()
		await flush()

		expect(fetchMock).not.toHaveBeenCalled()
		expect(form.querySelector('.fame-form__submission-error')?.textContent).toBe(
			'This payment method is unavailable The integration rejected this donation'
		)
	})

	test('handler.addError() from the listener blocks submission', async () => {
		const fetchMock = jest.fn()
		;(globalThis as any).fetch = fetchMock

		on('fame-lahjoitukset-submit', (event: Event) => {
			;(event as FormSubmitEvent).detail.handler.addError('email', 'Required')
		})

		submit()
		await flush()

		expect(fetchMock).not.toHaveBeenCalled()

		const email = form.querySelector<HTMLInputElement>('input[name="email"]')!
		expect(email.validity.customError).toBe(true)
		expect(email.validationMessage).toBe('Required')
	})

	test('an API validation error preserves button focus during loading and then focuses the field', async () => {
		const fetchMock = jest.fn<() => Promise<any>>().mockResolvedValue({
			ok: false,
			statusText: 'Unprocessable Entity',
			json: async () => ({
				message: 'Invalid form',
				error: { email: 'Check the email address' },
			}),
		})
		;(globalThis as any).fetch = fetchMock

		const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!
		const email = form.querySelector<HTMLInputElement>('[name="email"]')!
		button.focus()
		submit()

		expect(button.disabled).toBe(false)
		await flush()

		expect(form.ownerDocument.activeElement).toBe(email)
		expect(email.getAttribute('aria-invalid')).toBe('true')
		expect(button.disabled).toBe(false)
	})

	test('an API amount error is shown on the visible amount control', async () => {
		const fetchMock = jest.fn<() => Promise<any>>().mockResolvedValue({
			ok: false,
			statusText: 'Unprocessable Entity',
			json: async () => ({
				message: 'Invalid form',
				error: { amount: 'Choose a supported donation amount' },
			}),
		})
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()

		const amount = form.querySelector<HTMLInputElement>('#amount-choice')!
		expect(amount.getAttribute('aria-invalid')).toBe('true')
		expect(form.ownerDocument.activeElement).toBe(amount)
		expect(form.querySelector('.donation-amounts__error')?.textContent).toBe(
			'Choose a supported donation amount'
		)
	})

	test('a non-validation API failure is announced at form level', async () => {
		const fetchMock = jest.fn<() => Promise<any>>().mockResolvedValue({
			ok: false,
			statusText: 'Server Error',
			json: async () => ({ message: 'Temporary failure' }),
		})
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()

		expect(form.querySelector('.fame-form__submission-error')?.textContent).toBe(
			'The donation could not be submitted. Please try again.'
		)
		expect(form.querySelector('.fame-form__submission-error')?.getAttribute('role')).toBe(
			'alert'
		)
		expect(console).toHaveErrored()
	})

	test('a rejected request is announced and logged', async () => {
		const requestError = new TypeError('Failed to fetch')
		;(globalThis as any).fetch = jest.fn().mockRejectedValue(requestError)

		submit()
		await flush()

		expect(form.querySelector('.fame-form__submission-error')?.textContent).toBe(
			'The donation could not be submitted. Please try again.'
		)
		expect(console).toHaveErroredWith('Donation form submission failed', requestError)
	})

	test('a non-JSON server failure is announced and logged', async () => {
		const parseError = new SyntaxError('Unexpected token <')
		;(globalThis as any).fetch = jest.fn().mockResolvedValue({
			ok: false,
			statusText: 'Server Error',
			json: async () => {
				throw parseError
			},
		})

		submit()
		await flush()

		expect(form.querySelector('.fame-form__submission-error')?.textContent).toBe(
			'The donation could not be submitted. Please try again.'
		)
		expect(console).toHaveErroredWith('Donation form submission failed', parseError)
	})

	test('mutated detail.data is sent in the request body', async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ redirect_url: '/thanks' }) })
		;(globalThis as any).fetch = fetchMock

		on('fame-lahjoitukset-submit', (event: Event) => {
			;(event as FormSubmitEvent).detail.data.campaign = 'spring'
		})
		// Suppress the success redirect so jsdom does not attempt navigation.
		on('fame-lahjoitukset-result', (event: Event) => event.preventDefault())

		submit()
		await flush()

		expect(fetchMock).toHaveBeenCalledTimes(1)

		const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
		const body = JSON.parse(options.body as string)
		expect(body).toEqual({
			amount: '1000',
			type: 'single',
			provider: 'stripe',
			email: '',
			campaign: 'spring',
		})
	})

	test('ignores a second submission while a request is in progress', async () => {
		let resolveRequest: (response: any) => void = () => undefined
		const pendingRequest = new Promise<any>(resolve => {
			resolveRequest = resolve
		})
		const fetchMock = jest.fn<() => Promise<any>>().mockReturnValue(pendingRequest)
		;(globalThis as any).fetch = fetchMock
		on('fame-lahjoitukset-result', (event: Event) => event.preventDefault())

		submit()
		submit()

		expect(fetchMock).toHaveBeenCalledTimes(1)
		resolveRequest({ ok: true, json: async () => ({ redirect_url: '/thanks' }) })
		await flush()
	})

	test('releases the submission guard after a same-document redirect', async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ redirect_url: '#thanks' }) })
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()
		submit()

		await flush()
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(form.classList.contains('fame-form--submitting')).toBe(false)
		expect(form.querySelector('[type="submit"]')?.getAttribute('aria-disabled')).toBe('false')
	})

	test('releases the submission guard for an empty fragment redirect', async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ redirect_url: '#' }) })
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()

		expect(form.classList.contains('fame-form--submitting')).toBe(false)
		expect(form.querySelector('[type="submit"]')?.getAttribute('aria-disabled')).toBe('false')
	})

	test('keeps the submission guard during a redirect to the same URL without a hash', async () => {
		const redirect = new URL(window.location.href)
		redirect.hash = ''
		const fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ redirect_url: redirect.href }),
		})
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()

		expect(form.classList.contains('fame-form--submitting')).toBe(true)
		expect(form.querySelector('[type="submit"]')?.getAttribute('aria-disabled')).toBe('true')
	})

	test('restores submission after a bfcache pageshow', async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ redirect_url: '/thanks' }) })
		;(globalThis as any).fetch = fetchMock

		submit()
		await flush()
		expect(form.classList.contains('fame-form--submitting')).toBe(true)

		window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
		expect(form.classList.contains('fame-form--submitting')).toBe(false)
		expect(form.classList.contains('fame-form--submitted')).toBe(false)
		expect(form.querySelector('[type="submit"]')?.getAttribute('aria-disabled')).toBe('false')

		submit()
		expect(fetchMock).toHaveBeenCalledTimes(2)
		await flush()
		expect(console).toHaveErrored()
	})

	test('dispatches fame-lahjoitukset-result on success and preventDefault suppresses the redirect', async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ redirect_url: '/thanks' }) })
		;(globalThis as any).fetch = fetchMock

		const hrefBefore = window.location.href
		let captured: FormResultEvent | undefined

		on('fame-lahjoitukset-result', (event: Event) => {
			captured = event as FormResultEvent
			event.preventDefault()
		})

		submit()
		await flush()

		expect(captured).toBeDefined()
		expect(captured!.detail.result.redirect_url).toBe('/thanks')
		expect(captured!.detail.handler).toBe(handler)
		expect(window.location.href).toBe(hrefBefore)
	})
})
