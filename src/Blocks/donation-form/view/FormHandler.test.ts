import { jest, describe, beforeEach, test, expect } from '@jest/globals'
import FormHandler from './FormHandler'
import { ErrorTranslations } from './Validation.ts'

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

		new FormHandler('/submit', form, mockTranslations)
		expect(form.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function))
	})
})
