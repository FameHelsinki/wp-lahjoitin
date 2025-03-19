import AmountHandler from './AmountHandler.ts'

type ValidationResult = {
	[key: string]: any
}

class ValidationError extends Error {
	errors: ValidationResult

	constructor(message: string, errors: ValidationResult) {
		super(message)
		this.errors = errors
	}
}

export type FormSubmitEvent = CustomEvent<{
	data: { [key: string]: FormDataEntryValue }
	handler: FormHandler
	errors: ValidationResult
}>

export default class FormHandler {
	readonly #url: string
	readonly #form: HTMLFormElement
	readonly #submit: NodeListOf<HTMLButtonElement | HTMLInputElement>
	readonly #amount: AmountHandler

	get form() {
		return this.#form
	}

	get amount() {
		return this.#amount
	}

	constructor(url: string, form: HTMLFormElement) {
		this.#url = url
		this.#form = form
		this.#form.addEventListener('submit', this.#onSubmit.bind(this));
		this.#submit = this.#form.querySelectorAll('[type="submit"]')
		this.#amount = new AmountHandler(this.#form)

		// Form submit requires javascript, so all
		// submit buttons are disabled by default.
		this.#allowSubmit(true)
	}

	async #onSubmit(event: SubmitEvent) {
		event.preventDefault()

		// Disable form submit.
		this.#allowSubmit(false)
		this.clearErrors()

		const form = event.target as HTMLFormElement
		const formData = new FormData(form)
		const data = Object.fromEntries(formData)

		// Allow plugins to alter form data.
		const alterFormDataEvent: FormSubmitEvent = new CustomEvent('fame-lahjoitukset-submit', {
			detail: {
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
				await this.#submitForm(alterFormDataEvent.detail.data)
			}
		}
		catch (error) {
			if (error instanceof ValidationError) {
				Object.entries(alterFormDataEvent.detail.errors).forEach(([key, error]) => {
					this.addError(key, error)
				})
				return
			}

			throw error;
		}
		finally {
			this.#allowSubmit(true)
		}
	}

	async #submitForm(data: any) {
		console.log('submit data', data)

		const response = await fetch(this.getSubmitUrl(), {
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

		console.log(result)

		return result
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
			throw new ValidationError(message, body.error)
		}

		throw new Error(response.statusText)
	}

	validate(): boolean {
		const valid = this.#form.checkValidity()
		this.#form.classList.add('was-validated')

		if (!valid) {
			// Create error messages from built in validation values.
			Array.prototype.forEach.call(this.#form.elements, (element: HTMLObjectElement) => {
				if (!element.validity.valid && !element.validity.customError) {
					this.addError(element.name, element.validity)
				}
			})
		}

		return valid
	}

	/**
	 * Clears validation errors.
	 */
	clearErrors() {
		Array.prototype.forEach.call(this.#form.elements, (element: HTMLObjectElement) => {
			// Remove all custom errors.
			if (element.validity.customError) {
				element.setCustomValidity('');
			}
		})
	}

	/**
	 * Adds error message to given form element.
	 *
	 * @param name
	 * @param error
	 */
	addError(name: string, error: string|ValidityState) {
		const element = this.#form.elements.namedItem(name)

		if (error instanceof ValidityState && (error.valid || error.customError)) {
			throw new Error(`Invalid error ${error} for ${element}`)
		}

		const message = typeof error === 'string' ? error : this.#getErrorMessage(name, error)

		if (element instanceof RadioNodeList) {
			if (typeof error === 'string') {
				Array.prototype.forEach.call(element, item => {
					if (item instanceof HTMLObjectElement) {
						item.setCustomValidity(message)
					}
				})
			}
		}
		else if (element instanceof HTMLObjectElement || element instanceof HTMLInputElement) {
			if (element.type === 'hidden') {
				throw new Error(`Trying to set validation message to hidden element ${name}`)
			}

			if (typeof error === 'string') {
				element.setCustomValidity(message)
			}
		}
		else {
			throw new Error(`Trying to set validation message to unknown element ${name}`)
		}
	}

	#getErrorMessage(name: string, validity: ValidityState) {
		if (!validity.valid) {
			return 'Invalid value';
		}

		throw new Error(`Element ${name} is valid`)
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
