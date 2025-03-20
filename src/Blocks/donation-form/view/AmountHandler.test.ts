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
				<input name="amount-recurring" type="number" min="1" value="10">
			</div>
        `

		wrapper = document.querySelector('div')!
		mockOnChange.mockReset()
		amountWrapper = new AmountWrapper(wrapper, mockOnChange)
	})

	test('should return the correct type', () => {
		expect(amountWrapper.type).toBe('recurring')
	})

	test('should hide the wrapper when disabled is set to true', () => {
		amountWrapper.disabled = true
		expect(wrapper.style.display).toBe('none')
	})

	test('should show the wrapper when disabled is set to false', () => {
		amountWrapper.disabled = false
		expect(wrapper.style.display).toBe('')
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
