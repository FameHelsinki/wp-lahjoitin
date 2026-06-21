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

		new FormHandler('/submit', 'my-org', form, mockTranslations)
		expect(form.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function))
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

	test('getSubmitUrl appends contact and token query params', () => {
		document.body.innerHTML = `
            <form action="/submit" data-token="1">
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
		expect(url.searchParams.get('token')).toBe('1')
	})
})
