import { beforeEach, describe, expect, test } from '@jest/globals'
import FormValidation from './FormValidation'

describe('FormValidation external errors', () => {
	let form: HTMLFormElement
	let validation: FormValidation

	beforeEach(() => {
		document.body.innerHTML = `
			<form novalidate>
				<fieldset>
					<legend>Payment method</legend>
					<div class="fame-form__group">
						<label for="provider-one">Paytrail</label>
						<input id="provider-one" type="radio" name="provider" value="one" required />
					</div>
					<div class="fame-form__group">
						<label for="provider-two">MobilePay</label>
						<input id="provider-two" type="radio" name="provider" value="two" required />
					</div>
					<span id="provider-error" class="fame-form__feedback" data-validation-for="provider"></span>
				</fieldset>
				<div class="fame-form__group">
					<input id="other-amount" name="amount-single" type="number" data-custom-validator />
				</div>
				<div class="fame-form__group">
					<input id="email" name="email" type="email" required />
					<span id="email-error" class="fame-form__feedback" data-validation-for="email"></span>
				</div>
				<p class="fame-form__validation-announcer" aria-live="polite"></p>
			</form>
		`
		form = document.querySelector('form')!
		validation = new FormValidation(form, {
			_default: { unknown: 'Translated invalid value' },
			email: { required: 'Email is required', unknown: 'Invalid email' },
			provider: { required: 'Choose a payment method', unknown: 'Invalid payment method' },
		})
	})

	test('changing one radio clears an external error from the whole group', () => {
		const radios = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="provider"]'))
		validation.addError('provider', 'Choose a payment method')

		expect(radios.every(radio => radio.validity.customError)).toBe(true)
		expect(radios.every(radio => radio.getAttribute('aria-invalid') === 'true')).toBe(true)

		radios[1].checked = true
		radios[1].dispatchEvent(new Event('change', { bubbles: true }))

		expect(radios.every(radio => !radio.validity.customError)).toBe(true)
		expect(radios.every(radio => !radio.hasAttribute('aria-invalid'))).toBe(true)
		expect(form.querySelector('#provider-error')?.textContent).toBe('')
	})

	test('input clears an external error from a custom-validator field', () => {
		const amount = form.querySelector<HTMLInputElement>('[name="amount-single"]')!
		validation.addError('amount-single', 'Check the amount')

		expect(amount.validity.customError).toBe(true)
		amount.value = '20'
		amount.dispatchEvent(new Event('input', { bubbles: true }))

		expect(amount.validity.customError).toBe(false)
		expect(amount.hasAttribute('aria-invalid')).toBe(false)
	})

	test('a field is validated on blur and a corrected touched field clears its error', () => {
		const email = form.querySelector<HTMLInputElement>('[name="email"]')!
		email.dispatchEvent(new Event('input', { bubbles: true }))
		expect(email.hasAttribute('aria-invalid')).toBe(false)

		email.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
		expect(email.getAttribute('aria-invalid')).toBe('true')
		expect(form.querySelector('#email-error')?.textContent).toBe('Email is required')

		email.value = 'person@example.com'
		email.dispatchEvent(new Event('input', { bubbles: true }))
		expect(email.hasAttribute('aria-invalid')).toBe(false)
		expect(form.querySelector('#email-error')?.textContent).toBe('')
	})

	test('an unchanged error message is not written to the live region again', async () => {
		const email = form.querySelector<HTMLInputElement>('[name="email"]')!
		const feedback = form.querySelector<HTMLElement>('#email-error')!
		email.value = 'invalid'
		email.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

		let mutations = 0
		const observer = new MutationObserver(records => {
			mutations += records.length
		})
		observer.observe(feedback, { childList: true, characterData: true, subtree: true })

		email.value = 'still-invalid'
		email.dispatchEvent(new Event('input', { bubbles: true }))
		await Promise.resolve()
		observer.disconnect()

		expect(feedback.textContent).toBe('Invalid email')
		expect(mutations).toBe(0)
	})

	test('tabbing through radios does not show an error before submit', () => {
		const radios = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="provider"]'))
		radios[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

		expect(radios.every(radio => !radio.hasAttribute('aria-invalid'))).toBe(true)
		expect(form.querySelector('#provider-error')?.textContent).toBe('')

		expect(validation.validateAll()).toBe(false)
		expect(radios.every(radio => radio.getAttribute('aria-invalid') === 'true')).toBe(true)
		expect(form.querySelectorAll('[data-validation-for="provider"]')).toHaveLength(1)
		expect(form.querySelector('#provider-error')?.textContent).toBe('Choose a payment method')
	})

	test('unknown fields use the translated fallback message', () => {
		const field = document.createElement('input')
		field.name = 'unknown_field'
		field.required = true
		form.appendChild(field)

		field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

		expect(field.getAttribute('aria-invalid')).toBe('true')
		expect(form.querySelector('[data-validation-for="unknown_field"]')?.textContent).toBe(
			'Translated invalid value'
		)
	})

	test('hidden and unknown backend fields are reported as unmapped instead of throwing', () => {
		const hidden = document.createElement('input')
		hidden.type = 'hidden'
		hidden.name = 'hidden_field'
		form.appendChild(hidden)

		expect(validation.addError('hidden_field', 'Hidden error')).toBe(false)
		expect(validation.addError('missing_field', 'Missing error')).toBe(false)
	})

	test('announces one blur error and keeps batch validation out of the live region', () => {
		const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
		const email = form.querySelector<HTMLInputElement>('#email')!

		email.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
		expect(announcer.textContent).toContain('Email is required')
		expect(form.querySelector('#email-error')?.hasAttribute('aria-live')).toBe(false)

		validation.validateAll(true)
		expect(announcer.textContent).toBe('')
		expect(form.ownerDocument.activeElement).toBe(form.querySelector('[name="provider"]'))
	})

	test('each submit announces one error when focus stays on the invalid field', () => {
		const provider = form.querySelector<HTMLInputElement>('#provider-one')!
		provider.checked = true
		const email = form.querySelector<HTMLInputElement>('#email')!
		email.value = 'ada@'
		email.focus()

		const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
		const observer = new MutationObserver(() => undefined)
		observer.observe(announcer, { childList: true })
		try {
			for (let attempt = 0; attempt < 2; attempt++) {
				expect(validation.validateAll(false)).toBe(false)
				expect(announcer.textContent).toBe('')
				expect(validation.focusFirstInvalid()).toBe(true)
				expect(form.ownerDocument.activeElement).toBe(email)
				expect(announcer.textContent).toBe('email: Invalid email')
				const messages = observer.takeRecords().flatMap(record =>
					Array.from(record.addedNodes)
						.map(node => node.textContent)
						.filter(Boolean)
				)
				expect(messages).toEqual(['email: Invalid email'])
			}
		} finally {
			observer.disconnect()
		}

		email.value = 'ada@example.com'
		email.dispatchEvent(new Event('input', { bubbles: true }))
		expect(form.querySelector('.fame-form__validation-announcer')?.textContent).toBe('')
		expect(email.hasAttribute('aria-invalid')).toBe(false)
	})

	test('a focused invalid radio announces the group legend instead of its option label', () => {
		const radio = form.querySelector<HTMLInputElement>('#provider-one')!
		radio.focus()
		validation.validateAll(false)
		validation.focusFirstInvalid()

		expect(form.ownerDocument.activeElement).toBe(radio)
		expect(form.querySelector('.fame-form__validation-announcer')?.textContent).toBe(
			'Payment method: Choose a payment method'
		)

		const email = form.querySelector<HTMLInputElement>('#email')!
		email.value = 'ada@example.com'
		email.dispatchEvent(new Event('input', { bubbles: true }))
		expect(form.querySelector('.fame-form__validation-announcer')?.textContent).toBe(
			'Payment method: Choose a payment method'
		)
	})

	test.each(['input', 'change'])(
		'choosing another radio clears the group announcement on %s',
		eventType => {
			const radios = Array.from(form.querySelectorAll<HTMLInputElement>('[name="provider"]'))
			const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
			radios[0].focus()
			validation.validateAll(false)
			validation.focusFirstInvalid()
			expect(announcer.textContent).toContain('Choose a payment method')

			radios[1].checked = true
			radios[1].dispatchEvent(new Event(eventType, { bubbles: true }))

			expect(announcer.textContent).toBe('')
			expect(radios.every(radio => !radio.hasAttribute('aria-invalid'))).toBe(true)
			expect(form.querySelector('#provider-error')?.textContent).toBe('')
		}
	)

	test('correcting a radio group preserves a newer announcement from another component', () => {
		const radios = Array.from(form.querySelectorAll<HTMLInputElement>('[name="provider"]'))
		const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
		radios[0].focus()
		validation.validateAll(false)
		validation.focusFirstInvalid()
		expect(announcer.textContent).toContain('Choose a payment method')

		announcer.textContent = 'Other amount: The minimum donation amount is 5 €.'
		radios[1].checked = true
		radios[1].dispatchEvent(new Event('change', { bubbles: true }))

		expect(announcer.textContent).toBe('Other amount: The minimum donation amount is 5 €.')
		expect(radios.every(radio => !radio.hasAttribute('aria-invalid'))).toBe(true)
	})

	test('a type change preserves the announcement of a visible enabled email field', () => {
		const provider = form.querySelector<HTMLInputElement>('#provider-one')!
		provider.checked = true
		const email = form.querySelector<HTMLInputElement>('#email')!
		const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
		email.value = 'ada@'
		email.focus()
		validation.validateAll(false)
		validation.focusFirstInvalid()
		expect(announcer.textContent).toBe('email: Invalid email')

		const type = document.createElement('input')
		type.type = 'radio'
		type.name = 'type'
		type.value = 'recurring'
		form.appendChild(type)
		type.addEventListener('change', () => {
			provider.closest('fieldset')!.hidden = true
			provider.disabled = true
		})
		type.focus()
		type.checked = true
		type.dispatchEvent(new Event('change', { bubbles: true }))

		expect(email.matches(':disabled')).toBe(false)
		expect(email.closest('[hidden]')).toBeNull()
		expect(email.getAttribute('aria-invalid')).toBe('true')
		expect(announcer.textContent).toBe('email: Invalid email')
	})

	test.each([
		{ inactiveState: 'disabled', newerMessage: '' },
		{ inactiveState: 'hidden', newerMessage: '' },
		{ inactiveState: 'disabled', newerMessage: 'Other amount: Check the amount' },
		{ inactiveState: 'hidden', newerMessage: 'Other amount: Check the amount' },
	])(
		'a type change clears a $inactiveState control announcement and preserves newer message "$newerMessage"',
		({ inactiveState, newerMessage }) => {
			const radio = form.querySelector<HTMLInputElement>('#provider-one')!
			const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')!
			radio.focus()
			validation.validateAll(false)
			validation.focusFirstInvalid()
			expect(announcer.textContent).toBe('Payment method: Choose a payment method')
			if (newerMessage) announcer.textContent = newerMessage

			const type = document.createElement('input')
			type.type = 'radio'
			type.name = 'type'
			type.value = 'recurring'
			form.appendChild(type)
			// FormHandler filters provider controls on the target before this
			// change event reaches FormValidation's listener on the form.
			type.addEventListener('change', () => {
				if (inactiveState === 'disabled') radio.disabled = true
				else radio.closest('fieldset')!.hidden = true
			})
			type.checked = true
			type.dispatchEvent(new Event('change', { bubbles: true }))

			expect(announcer.textContent).toBe(newerMessage)
		}
	)
})
