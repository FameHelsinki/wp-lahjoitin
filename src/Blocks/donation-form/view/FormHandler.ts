import AmountHandler from './AmountHandler.ts'
import Validation, { ErrorTranslations, getErrorType } from './Validation.ts'
import { FormResultEvent, FormSubmitEvent } from './Events.ts'

type FormControlElement =
	| HTMLInputElement
	| HTMLTextAreaElement
	| HTMLSelectElement
	| HTMLButtonElement

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

	#providerField?: HTMLInputElement
	#providerRadios: NodeListOf<HTMLInputElement>
	#providerHiddens: NodeListOf<HTMLInputElement>
	#providerSections: NodeListOf<HTMLElement>
	#typeRadios: NodeListOf<HTMLInputElement>

	get form() {
		return this.#form
	}

	get amount() {
		return this.#amount
	}

	constructor(url: string, form: HTMLFormElement, translations: ErrorTranslations = {}) {
		this.#url = url
		this.#form = form

		this.#submit = this.#form.querySelectorAll('[type="submit"]')
		this.#amount = new AmountHandler(this.#form)
		this.#translations = translations

		// Initialize form elements.
		this.#providerField = this.#form.querySelector<HTMLInputElement>(
			'input[name="provider"][data-selected-provider]'
		)
		this.#providerRadios = this.#form.querySelectorAll<HTMLInputElement>(
			'input[type="radio"][name="provider"]'
		)
		this.#providerHiddens = this.#form.querySelectorAll<HTMLInputElement>(
			'input[type="hidden"][name="provider"][data-type]'
		)
		this.#providerSections = this.#form.querySelectorAll<HTMLElement>(
			'fieldset.payment-method-selector[data-type]'
		)
		this.#typeRadios = this.#form.querySelectorAll<HTMLInputElement>('input[name="type"]')

		this.#form.addEventListener('submit', this.#onSubmit.bind(this))

		// Bind events to provider radios and type radios.
		this.#bindProviderEvents()

		Array.prototype.forEach.call(this.#form.elements, element =>
			element.addEventListener('change', (event: Event) => {
				const target = event.target

				// Clear any custom errors on change.
				if (
					isFormControl(target) &&
					target.dataset['custom-validator'] === undefined &&
					target.validity.customError
				) {
					target.setCustomValidity('')
				}
			})
		)

		// Form submit requires javascript, so all
		// submit buttons are disabled by default.
		this.#allowSubmit(true)
	}

	/**
	 * This method binds events to provider radios and type
	 */
	#bindProviderEvents() {
		this.#filterProvidersByType()
		this.#updateProvider()
		this.#updateSubmitLabel()

		this.#providerRadios.forEach(r =>
			r.addEventListener('change', () => {
				this.#updateProvider()
			})
		)

		this.#typeRadios.forEach(r =>
			r.addEventListener('change', () => {
				this.#filterProvidersByType()
				this.#updateProvider()
				this.#updateSubmitLabel()
			})
		)
	}

	/**
	 * Show only the provider-fieldset of the selected type.
	 * If there is one option, it is automatically selected.
	 */
	#filterProvidersByType() {
		let selectedType = Array.from(this.#typeRadios).find(r => r.checked)?.value
		if (!selectedType && this.#typeRadios.length === 1) {
			selectedType = this.#typeRadios[0].value
			this.#typeRadios[0].checked = true
		}
		if (!selectedType) return

		this.#providerHiddens.forEach(h => {
			h.disabled = h.dataset.type !== selectedType
		})

		this.#providerSections.forEach(section => {
			const active = section.dataset.type === selectedType
			section.hidden = !active
			section.setAttribute('aria-hidden', String(!active))
			section.classList.remove('payment-method-selector--single')
			if (active) {
				const radios = section.querySelectorAll<HTMLInputElement>('input[type="radio"]')
				section.classList.toggle('payment-method-selector--single', radios.length === 1)
				if (radios.length === 1 && !radios[0].checked) {
					radios[0].checked = true
				}
			}
		})
		this.#updateSubmitLabel()
	}

	/**
	 * Update providerField value.
	 */
	#updateProvider() {
		if (!this.#providerField) return

		const selectedType = Array.from(this.#typeRadios).find(r => r.checked)?.value
		if (!selectedType) {
			this.#providerField.value = ''
			return
		}

		const activeSection = Array.from(this.#providerSections).find(
			fs => fs.dataset.type === selectedType && !fs.hidden
		)

		const checkedRadio =
			activeSection?.querySelector<HTMLInputElement>('input[type="radio"]:checked') || null

		if (checkedRadio) {
			this.#providerField.value = checkedRadio.value
			return
		}

		const singleHidden = activeSection?.querySelector<HTMLInputElement>(
			'input[type="hidden"][name="provider"]'
		)
		this.#providerField.value = singleHidden?.value ?? ''
	}

	/**
	 * Update submit button text based on selected donation type.
	 */
	#updateSubmitLabel() {
		const selectedType = Array.from(this.#typeRadios).find(r => r.checked)?.value
		if (!selectedType) return

		this.#submit.forEach(btn => {
			const el = btn as HTMLButtonElement | HTMLInputElement

			// Button
			if (el instanceof HTMLButtonElement) {
				const singleLabel = el.dataset.labelSingle
				const recurringLabel = el.dataset.labelRecurring
				if (!singleLabel || !recurringLabel) return

				el.textContent = selectedType === 'recurring' ? recurringLabel : singleLabel
				return
			}

			// Input type="submit" fallback
			if (el instanceof HTMLInputElement) {
				const singleLabel = el.dataset.labelSingle
				const recurringLabel = el.dataset.labelRecurring
				if (!singleLabel || !recurringLabel) return

				el.value = selectedType === 'recurring' ? recurringLabel : singleLabel
			}
		})
	}

	async #onSubmit(event: SubmitEvent) {
		event.preventDefault()

		this.#filterProvidersByType()
		this.#updateProvider()

		// Checks provider field value.
		if (!this.#providerField?.value) {
			this.addError('provider', 'Select payment method')
			this.#form.classList.add('was-validated')
			return
		}

		// Disable form submit.
		this.#allowSubmit(false)
		this.#form.classList.add('fame-form--submitting')

		const formData = new FormData(this.#form)
		const data = Object.fromEntries(formData)
		const url = this.getSubmitUrl()

		// Allow plugins to alter form data.
		const alterFormDataEvent: FormSubmitEvent = new CustomEvent('fame-lahjoitukset-submit', {
			detail: {
				url,
				data,
				handler: this,
				errors: {},
			},
		})

		window.dispatchEvent(alterFormDataEvent)

		Object.entries(alterFormDataEvent.detail.errors).forEach(([key, error]) => {
			this.addError(key, error)
		})

		try {
			// Run built-in validators. This should fail if
			// any validation errors were added by the event.
			if (!this.validate()) {
				return
			}

			// Events can cancel form submit by calling
			if (!alterFormDataEvent.defaultPrevented) {
				await this.#submitForm(
					alterFormDataEvent.detail.url,
					alterFormDataEvent.detail.data
				)
			}
		} catch (error) {
			console.error('Submit failed', error)

			if (error instanceof Validation) {
				Object.entries(error.errors).forEach(([key, error]) => {
					this.addError(key, error)
				})
				return
			}

			throw error
		} finally {
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
				handler: this,
			},
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
		// Overrides browser validation for the provider field when the provider is hidden.
		const hasValidProvider =
			!!this.#providerField?.value && this.#providerField?.value.trim() !== ''

		const valid = this.#form.checkValidity()

		this.#form.classList.add('was-validated')

		if (!valid && !hasValidProvider) {
			// Create error messages from built in validation values.
			Array.prototype.forEach.call(this.#form.elements, element => {
				if (!element.validity.valid && !element.validity.customError) {
					this.#addErrorToElement(
						element,
						this.#getErrorMessage(element.name, element.validity)
					)
				}
			})
		}

		return valid || hasValidProvider
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
		} else if (isFormControl(element)) {
			if (element.type === 'hidden') {
				throw new Error(`Trying to set validation message to hidden element ${name}`)
			}

			element.setCustomValidity(error)

			this.#addErrorToElement(element, error)
		} else {
			throw new Error(`Trying to set validation message to unknown element ${name}`)
		}
	}

	#addErrorToElement(element: FormControlElement, message: string) {
		const parent = element.closest('.fame-form__fieldset') || element.parentElement
		if (parent) {
			const feedback =
				parent.querySelector('.fame-form__feedback') ??
				parent.appendChild(document.createElement('span'))
			feedback.className = 'fame-form__feedback fame-form__feedback--invalid'
			feedback.setAttribute('aria-live', 'polite')
			feedback.textContent = message
		}
	}

	#getErrorMessage(name: string, validity: ValidityState) {
		if (validity.valid) {
			throw new Error(`Element ${name} is valid`)
		}

		return this.#translations[name]?.[getErrorType(validity)] ?? 'Invalid value'
	}

	/**
	 * Allow form submit.
	 */
	#allowSubmit(allow: boolean) {
		this.#submit.forEach(submit => (submit.disabled = !allow))
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
