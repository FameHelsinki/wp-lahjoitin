import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import AmountHandler, { AmountWrapper } from './AmountHandler'

describe('AmountWrapper', () => {
	let wrapper: HTMLElement, amountWrapper: AmountWrapper
	const mockOnChange = jest.fn()

	beforeEach(() => {
		document.body.innerHTML = `
			<div class="donation-amounts" data-type="recurring">
				<input data-type="recurring" checked="" name="amount-radio-recurring" value="10" type="radio">
				<input data-type="recurring" name="amount-radio-recurring" value="20" type="radio">
				<div class="donation-amounts__input-wrapper">
					<input name="amount-recurring" type="number" min="1" value="10">
				</div>
			</div>
			<p class="fame-form__validation-announcer" aria-live="polite"></p>
        `

		wrapper = document.querySelector('div')!
		mockOnChange.mockReset()
		amountWrapper = new AmountWrapper(
			wrapper,
			mockOnChange,
			undefined,
			document.querySelector('.fame-form__validation-announcer')
		)
	})

	test('should return the correct type', () => {
		expect(amountWrapper.type).toBe('recurring')
	})

	test('should hide the wrapper when disabled is set to true', () => {
		amountWrapper.disabled = true
		expect(wrapper.style.display).toBe('none')
		expect(Array.from(wrapper.querySelectorAll('input')).every(input => input.disabled)).toBe(
			true
		)
	})

	test('should show the wrapper when disabled is set to false', () => {
		amountWrapper.disabled = true
		amountWrapper.disabled = false
		expect(wrapper.style.display).toBe('')
		expect(Array.from(wrapper.querySelectorAll('input')).every(input => !input.disabled)).toBe(
			true
		)
	})

	test('should return the selected radio button value', () => {
		const radio = wrapper.querySelector('input[type="radio"][value="20"]') as HTMLInputElement
		radio.checked = true
		radio.dispatchEvent(new Event('change'))
		expect(amountWrapper.value).toBe(20)
	})

	test('should return the number input value if available', () => {
		const numberInput = wrapper.querySelector('input[type="number"]') as HTMLInputElement
		numberInput.value = '50'
		expect(amountWrapper.value).toBe(50)
	})

	test('should call onChange when a radio button is selected', () => {
		const radio = wrapper.querySelector('input[type="radio"][value="10"]') as HTMLInputElement
		radio.checked = true
		radio.dispatchEvent(new Event('change'))
		expect(mockOnChange).toHaveBeenCalledWith(10)
	})

	test('should call onChange when the number input is changed', () => {
		const numberInput = wrapper.querySelector('input[type="number"]') as HTMLInputElement
		numberInput.value = '40'
		numberInput.dispatchEvent(new Event('input'))
		expect(mockOnChange).toHaveBeenCalledWith(40)
	})

	test('should select correct button when the number input is changed', () => {
		const numberInput = wrapper.querySelector('input[type="number"]') as HTMLInputElement
		numberInput.value = '20'
		numberInput.dispatchEvent(new Event('input'))
		const radio = wrapper.querySelector('input[type="radio"]:checked') as HTMLInputElement
		expect(radio.value).toBe('20')
	})

	test('links an invalid other amount to its error and removes the link when corrected', () => {
		const numberInput = wrapper.querySelector('input[type="number"]') as HTMLInputElement
		numberInput.id = 'recurring-other'
		numberInput.value = '0'
		numberInput.dispatchEvent(new Event('input'))

		const error = wrapper.querySelector('.donation-amounts__error') as HTMLElement
		expect(numberInput.getAttribute('aria-invalid')).toBe('true')
		expect(numberInput.getAttribute('aria-describedby')).toContain(error.id)
		expect(error.textContent).not.toBe('')
		expect(error.hasAttribute('aria-live')).toBe(false)
		expect(document.querySelector('.fame-form__validation-announcer')?.textContent).toBe('')

		numberInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
		expect(document.querySelector('.fame-form__validation-announcer')?.textContent).toContain(
			'The minimum donation amount'
		)

		numberInput.value = '2'
		numberInput.dispatchEvent(new Event('input'))
		expect(numberInput.hasAttribute('aria-invalid')).toBe(false)
		expect(numberInput.hasAttribute('aria-describedby')).toBe(false)
		expect(error.textContent).toBe('')
		expect(document.querySelector('.fame-form__validation-announcer')?.textContent).toBe('')
	})

	test('correcting the amount preserves a newer announcement from another component', () => {
		const numberInput = wrapper.querySelector<HTMLInputElement>('input[type="number"]')!
		const announcer = document.querySelector<HTMLElement>('.fame-form__validation-announcer')!
		numberInput.value = '0'
		numberInput.dispatchEvent(new Event('input'))
		numberInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
		expect(announcer.textContent).toContain('The minimum donation amount')

		announcer.textContent = 'Email: Invalid email'
		numberInput.value = '5'
		numberInput.dispatchEvent(new Event('input'))

		expect(announcer.textContent).toBe('Email: Invalid email')
		expect(numberInput.hasAttribute('aria-invalid')).toBe(false)
	})

	test('links a backend amount error to the selected visible control', () => {
		const selected = wrapper.querySelector<HTMLInputElement>('input[type="radio"]:checked')!

		expect(amountWrapper.addError('Check the donation amount')).toBe(true)

		const error = wrapper.querySelector<HTMLElement>('.donation-amounts__error')!
		for (const radio of wrapper.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
			expect(radio.getAttribute('aria-invalid')).toBe('true')
			expect(radio.getAttribute('aria-describedby')).toContain(error.id)
		}
		expect(error.textContent).toBe('Check the donation amount')
		expect(amountWrapper.invalid).toBe(true)

		const otherRadio = wrapper.querySelector<HTMLInputElement>('input[value="20"]')!
		otherRadio.checked = true
		otherRadio.dispatchEvent(new Event('change'))
		expect(selected.hasAttribute('aria-invalid')).toBe(false)
		expect(otherRadio.hasAttribute('aria-invalid')).toBe(false)
		expect(amountWrapper.invalid).toBe(false)
	})
})

describe('AmountHandler', () => {
	let form: HTMLFormElement, mockAmountInput: HTMLInputElement

	beforeEach(() => {
		document.body.innerHTML = `
            <form>
                <input type="hidden" name="amount" value="1000">
				<div class="donation-amounts" data-type="recurring">
					<input name="amount-recurring" type="number" min="1" value="10">
				</div>
				<div class="donation-amounts" data-type="single">
					<input name="amount-recurring" type="number" min="1" value="10">
				</div>
                <input type="radio" name="type" value="single">
                <input type="radio" name="type" value="recurring">
            </form>
        `

		form = document.querySelector('form')!
		mockAmountInput = form.querySelector('input[name="amount"]')!
	})

	test('should initialize with the correct amount', () => {
		const amountHandler = new AmountHandler(form)
		expect(amountHandler.amount).toBe(10)
	})

	test('should update amount correctly', () => {
		const amountHandler = new AmountHandler(form)
		amountHandler.amount = 20
		expect(mockAmountInput.value).toBe('2000')
	})

	test('should update hidden amount correctly', () => {
		const amountHandler = new AmountHandler(form)
		const numberInput = form.querySelector('input[type="number"]') as HTMLInputElement
		numberInput.value = '20'
		numberInput.dispatchEvent(new Event('input'))
		expect(amountHandler.amount).toBe(20)
		expect(form.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('2000')
	})

	test('should throw an error if amount input is missing', () => {
		form.querySelector('input[name="amount"]')?.remove()
		expect(() => new AmountHandler(form)).toThrow('Missing amount element')
	})
})
