import AmountHandler from './AmountHandler.ts'
import Validation, { ErrorTranslations, getErrorType } from './Validation.ts'
import { FormResultEvent, FormSubmitEvent } from './Events.ts'

type FormControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement

function isFormControl(element: any): element is FormControlElement {
	return (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLButtonElement
	)
}

export default class FormHandler {
	readonly #url: string
	readonly #form: HTMLFormElement
	readonly #submit: NodeListOf<HTMLButtonElement | HTMLInputElement>
	readonly #amount: AmountHandler
	readonly #translations: ErrorTranslations

	get form() {
		return this.#form
	}

	get amount() {
		return this.#amount
	}

	constructor(url: string, form: HTMLFormElement, translations: ErrorTranslations = {}) {
		this.#url = url
		this.#form = form
		this.#form.addEventListener('submit', this.#onSubmit.bind(this));
		this.#submit = this.#form.querySelectorAll('[type="submit"]')
		this.#amount = new AmountHandler(this.#form)
		this.#translations = translations

		Array.prototype.forEach.call(this.#form.elements, element => element.addEventListener('change', (event: Event) => {
			const target = event.target

			// Clear any custom errors on change.
			if (isFormControl(target) && target.dataset['custom-validator'] === undefined && target.validity.customError) {
				target.setCustomValidity('')
			}
		}))

		// Form submit requires javascript, so all
		// submit buttons are disabled by default.
		this.#allowSubmit(true)
	}

	async #onSubmit(event: SubmitEvent) {
		event.preventDefault()

		// Disable form submit.
		this.#allowSubmit(false)
		this.#form.classList.add('fame-form--submitting')

		const form = event.target as HTMLFormElement
		const formData = new FormData(form)
		const data = Object.fromEntries(formData)
		const url = this.getSubmitUrl()

		// Allow plugins to alter form data.
		const alterFormDataEvent: FormSubmitEvent = new CustomEvent('fame-lahjoitukset-submit', {
			detail: {
				url,
				data,
				handler: this,
				errors: {},
			}
		})

		window.dispatchEvent(alterFormDataEvent)

		Object.entries(alterFormDataEvent.detail.errors).forEach(([key, error]) => {
			this.addError(key, error)
		})

		try {
			// Run built-in validators. This should fail if
			// any validation errors were added by the event.
			if (!this.validate()) {
				return;
			}

			// Events can cancel form submit by calling
			if (!alterFormDataEvent.defaultPrevented) {
				await this.#submitForm(alterFormDataEvent.detail.url, alterFormDataEvent.detail.data)
			}
		}
		catch (error) {
			console.error('Submit failed', error)

			if (error instanceof Validation) {
				Object.entries(error.errors).forEach(([key, error]) => {
					this.addError(key, error)
				})
				return
			}

			throw error;
		}
		finally {
			this.#allowSubmit(true)
			this.#form.classList.remove('fame-form--submitting')
		}
	}

	async #submitForm(url: URL, data: any) {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		if (!response.ok) {
			await this.#throwErrorResponse(response)
		}

		const result = await response.json()

		// Allow plugins to alter form result.
		const formResultEvent: FormResultEvent = new CustomEvent('fame-lahjoitukset-result', {
			detail: {
				result,
				handler: this
			}
		})

		this.#form.classList.add('fame-form--submitted')

		window.dispatchEvent(formResultEvent)

		// Redirect to success URL.
		if (!formResultEvent.defaultPrevented) {
			window.location.href = formResultEvent.detail.result.redirect_url
		}
	}

	/**
	 * Parses backend failure and throws appropriate exception.
	 *
	 * @param response
	 * @private
	 */
	async #throwErrorResponse(response: Response): Promise<never> {
		const body = await response.json()
		const message = body.message || response.statusText

		// If API returned validation errors.
		if (body.error) {
			throw new Validation(message, body.error)
		}

		throw new Error(response.statusText)
	}

	validate(): boolean {
		const valid = this.#form.checkValidity()
		this.#form.classList.add('was-validated')

		if (!valid) {
			// Create error messages from built in validation values.
			Array.prototype.forEach.call(this.#form.elements, (element) => {
				if (!element.validity.valid && !element.validity.customError) {
					this.#addErrorToElement(element, this.#getErrorMessage(element.name, element.validity))
				}
			})
		}

		return valid
	}

	/**
	 * Adds custom error message to given form element.
	 *
	 * @param name
	 * @param error
	 */
	addError(name: string, error: string) {
		const element = this.#form.elements.namedItem(name)

		if (element instanceof RadioNodeList) {
			Array.prototype.forEach.call(element, (item, idx) => {
				if (item instanceof HTMLInputElement) {
					item.setCustomValidity(error)

					// For the first element only.
					if (idx === 0) {
						this.#addErrorToElement(item, error)
					}
				}
			})
		}
		else if (isFormControl(element)) {
			if (element.type === 'hidden') {
				throw new Error(`Trying to set validation message to hidden element ${name}`)
			}

			element.setCustomValidity(error)

			this.#addErrorToElement(element, error)
		}
		else {
			throw new Error(`Trying to set validation message to unknown element ${name}`)
		}
	}

	#addErrorToElement(element: FormControlElement, message: string) {
		const parent = element.closest('.fame-form__fieldset') || element.parentElement
		if (parent) {
			const feedback = parent.querySelector('.fame-form__feedback') ?? parent.appendChild(document.createElement('span'))
			feedback.className = 'fame-form__feedback fame-form__feedback--invalid'
			feedback.setAttribute('aria-live', 'polite')
			feedback.textContent = message
		}
	}

	#getErrorMessage(name: string, validity: ValidityState) {
		if (validity.valid) {
			throw new Error(`Element ${name} is valid`)
		}

		return this.#translations[name]?.[getErrorType(validity)] ?? 'Invalid value';
	}

	/**
	 * Allow form submit.
	 */
	#allowSubmit(allow: boolean) {
		this.#submit.forEach(submit => submit.disabled = !allow)
	}

	/**
	 * Get submit URL.
	 *
	 * @private
	 */
	getSubmitUrl() {
		const url = new URL(`${this.#url}/donation`)

		// @todo move contact parameter to form.
		// Check if contact form should be required.
		const contact = this.#form.querySelector('[data-contact]')
		if (contact instanceof HTMLElement && !!contact.dataset.contact) {
			url.searchParams.append('contact', '1')
		}

		// Request token.
		if (!!this.#form.dataset.token) {
			url.searchParams.append('token', '1')
		}

		return url
	}
}
