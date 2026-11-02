import AmountHandler, { AmountMessages } from './AmountHandler.ts'
import FormValidation from './FormValidation.ts'
import Validation, { ErrorTranslations } from './Validation.ts'
import { FormResultEvent, FormSubmitEvent } from './Events.ts'

/**
 * All translatable strings used by the donation form, bundled into a single
 * object. The caller passes one bundle; FormHandler distributes the pieces to
 * the sub-components that render them.
 */
export type Translations = {
	errors?: ErrorTranslations
	amount?: AmountMessages
	submitError?: string
}

export default class FormHandler {
	readonly #url: string
	readonly #slug: string
	readonly #form: HTMLFormElement
	readonly #submit: NodeListOf<HTMLButtonElement | HTMLInputElement>
	readonly #amount: AmountHandler
	readonly #validation: FormValidation
	readonly #submitStatus: HTMLElement | null
	readonly #submissionError: HTMLElement | null
	readonly #submitErrorMessage: string

	#providerField: HTMLInputElement | null
	#providerRadios: NodeListOf<HTMLInputElement>
	#providerHiddens: NodeListOf<HTMLInputElement>
	#providerSections: NodeListOf<HTMLElement>
	#typeRadios: NodeListOf<HTMLInputElement>
	#dueDateSections: NodeListOf<HTMLElement>
	#dueDateInputs: NodeListOf<HTMLSelectElement | HTMLInputElement>
	#submitting = false
	#hasUnmappedError = false

	get form() {
		return this.#form
	}

	get amount() {
		return this.#amount
	}

	constructor(url: string, slug: string, form: HTMLFormElement, translations: Translations = {}) {
		this.#url = url
		this.#slug = slug
		this.#form = form

		this.#submit = this.#form.querySelectorAll('[type="submit"]')
		this.#amount = new AmountHandler(this.#form, translations.amount)
		this.#validation = new FormValidation(
			this.#form,
			translations.errors,
			this.#updateSubmitState.bind(this)
		)
		this.#submitStatus = this.#form.querySelector('.fame-form__submit-status')
		this.#submissionError = this.#form.querySelector('.fame-form__submission-error')
		this.#submitErrorMessage =
			translations.submitError ?? 'The donation could not be submitted. Please try again.'

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
		this.#dueDateSections = this.#form.querySelectorAll<HTMLElement>(
			'[data-recurring-due-date]'
		)
		// The day is a <select> when several days are configured and a hidden
		// input otherwise.
		this.#dueDateInputs = this.#form.querySelectorAll<HTMLSelectElement | HTMLInputElement>(
			'[data-recurring-due-date-input]'
		)

		this.#form.addEventListener('submit', this.#onSubmit.bind(this))
		window.addEventListener('pageshow', event => {
			if (event.persisted) this.#finishSubmitting()
		})
		this.#form.addEventListener('fame-lahjoitukset-amount-validity', () => {
			this.#updateSubmitState()
		})

		// Bind events to provider radios and type radios.
		this.#bindProviderEvents()

		this.#updateSubmitState()
	}

	/**
	 * This method binds events to provider radios and type
	 */
	#bindProviderEvents() {
		this.#filterProvidersByType()
		this.#filterDueDateByType()
		this.#updateProvider()
		this.#updateSubmitLabel()

		this.#providerRadios.forEach(r =>
			r.addEventListener('change', () => {
				this.#updateProvider()
				this.#updateSubmitState()
			})
		)

		this.#typeRadios.forEach(r =>
			r.addEventListener('change', () => {
				this.#filterProvidersByType()
				this.#filterDueDateByType()
				this.#updateProvider()
				this.#updateSubmitLabel()
				this.#updateSubmitState()
			})
		)
	}

	/**
	 * Only recurring donations submit a due_date. Disabled controls are omitted
	 * from FormData and ignored by native constraint validation.
	 */
	#filterDueDateByType() {
		let selectedType = Array.from(this.#typeRadios).find(r => r.checked)?.value
		if (!selectedType && this.#typeRadios.length === 1) {
			selectedType = this.#typeRadios[0].value
		}

		const active = selectedType === 'recurring'
		this.#dueDateSections.forEach(section => {
			section.hidden = !active
			section.setAttribute('aria-hidden', String(!active))
		})
		this.#dueDateInputs.forEach(input => {
			input.disabled = !active
		})
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
			section.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(radio => {
				radio.disabled = !active
			})
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

	#hasAvailableProvider(): boolean {
		return !!this.#providerField?.value && this.#providerField.value.trim() !== ''
	}

	#canSubmit(): boolean {
		return this.#hasAvailableProvider() && !this.#amount.invalid && this.#validation.valid
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

				// fallback to old pages: current button text
				const fallback = el.textContent?.trim() || ''

				el.textContent =
					selectedType === 'recurring'
						? (recurringLabel ?? fallback)
						: (singleLabel ?? fallback)

				return
			}

			// <input type="submit">
			if (el instanceof HTMLInputElement) {
				const singleLabel = el.dataset.labelSingle
				const recurringLabel = el.dataset.labelRecurring

				// fallback to old pages: current value
				const fallback = el.value

				el.value =
					selectedType === 'recurring'
						? (recurringLabel ?? fallback)
						: (singleLabel ?? fallback)
			}
		})
	}

	async #onSubmit(event: SubmitEvent) {
		event.preventDefault()
		if (this.#submitting) return

		this.#filterProvidersByType()
		this.#filterDueDateByType()
		this.#updateProvider()
		this.#hasUnmappedError = false
		if (this.#submissionError) {
			this.#submissionError.textContent = ''
		}

		// An aria-disabled submit stays in the keyboard order so its status and
		// description remain available to assistive technology. It has no submit
		// action until progressive field validation marks the form as complete.
		if (!this.#canSubmit()) {
			this.#validation.validateAll(false)
			this.#validation.focusFirstInvalid()
			this.#updateSubmitState()
			return
		}

		// Recheck all constraints as a final safety net before sending data.
		if (!this.#validation.validateAll(true)) {
			this.#updateSubmitState()
			return
		}
		this.#setSubmitting(true)
		this.#form.classList.add('fame-form--submitting')

		const formData = new FormData(this.#form)
		const data = Object.fromEntries(formData)
		this.#removeEmptyOptionalFields(data)
		const url = this.getSubmitUrl()

		// Allow plugins to alter form data.
		const alterFormDataEvent: FormSubmitEvent = new CustomEvent('fame-lahjoitukset-submit', {
			cancelable: true,
			detail: {
				url,
				data,
				handler: this,
				errors: {},
			},
		})

		let keepSubmitting = false
		try {
			window.dispatchEvent(alterFormDataEvent)

			Object.entries(alterFormDataEvent.detail.errors).forEach(([key, error]) => {
				this.addError(key, error)
			})

			// Run built-in validators. This should fail if
			// any validation errors were added by the event.
			if (!this.validate()) {
				this.#validation.focusFirstInvalid()
				return
			}

			// Events can cancel form submit by calling
			if (!alterFormDataEvent.defaultPrevented) {
				keepSubmitting = await this.#submitForm(
					alterFormDataEvent.detail.url,
					alterFormDataEvent.detail.data
				)
			}
		} catch (error) {
			if (error instanceof Validation) {
				Object.entries(error.errors).forEach(([key, message]) => {
					this.addError(key, message)
				})
				this.#validation.focusFirstInvalid()
				return
			}

			// Keep unexpected transport and response failures diagnosable while the
			// user receives a safe, localized message.
			// eslint-disable-next-line no-console
			console.error('Donation form submission failed', error)
			this.#showSubmissionError(this.#submitErrorMessage)
			return
		} finally {
			if (!keepSubmitting) {
				this.#finishSubmitting()
			}
		}
	}

	async #submitForm(url: URL, data: any): Promise<boolean> {
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
			cancelable: true,
			detail: {
				result,
				handler: this,
			},
		})

		this.#form.classList.add('fame-form--submitted')

		window.dispatchEvent(formResultEvent)

		// Redirect to success URL.
		if (!formResultEvent.defaultPrevented) {
			const redirectUrl = formResultEvent.detail.result.redirect_url
			const redirect = new URL(redirectUrl, window.location.href)
			const current = new URL(window.location.href)
			const sameDocument =
				redirectUrl.includes('#') &&
				redirect.origin === current.origin &&
				redirect.pathname === current.pathname &&
				redirect.search === current.search
			window.location.href = redirect.href
			return !sameDocument
		}

		return false
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
		return (
			this.#validation.validateAll(true) && !this.#amount.invalid && !this.#hasUnmappedError
		)
	}

	/**
	 * Adds custom error message to given form element.
	 *
	 * @param name
	 * @param error
	 */
	addError(name: string, error: string): boolean {
		const mapped =
			name === 'amount'
				? this.#amount.addError(error)
				: this.#validation.addError(name, error)

		if (!mapped) {
			this.#hasUnmappedError = true
			this.#showSubmissionError(error)
		}

		return mapped
	}

	#showSubmissionError(message: string): void {
		if (!this.#submissionError) return
		const existing = this.#submissionError.textContent?.trim()
		if (!existing) {
			this.#submissionError.textContent = message
		} else if (!existing.includes(message)) {
			this.#submissionError.textContent = `${existing} ${message}`
		}
	}

	#removeEmptyOptionalFields(data: Record<string, FormDataEntryValue>) {
		if (data.campaign === '') {
			delete data.campaign
		}
	}

	#updateSubmitState(): void {
		const complete = this.#canSubmit()
		const available = complete && !this.#submitting
		this.#submit.forEach(submit => {
			// Keep focus on the button while the request is in progress. The
			// submitting guard prevents duplicate requests while aria-disabled
			// communicates the temporarily unavailable action.
			submit.disabled = false
			submit.setAttribute('aria-disabled', String(!available))
			submit.classList.toggle('fame-form__submit--inactive', !available)
		})

		if (this.#submitStatus) {
			const message = complete
				? this.#submitStatus.dataset.readyStatus
				: this.#submitStatus.dataset.incompleteStatus
			if (message && this.#submitStatus.textContent?.trim() !== message) {
				this.#submitStatus.textContent = message
			}
		}
	}

	#setSubmitting(submitting: boolean): void {
		this.#submitting = submitting
		this.#updateSubmitState()
	}

	#finishSubmitting(): void {
		this.#form.classList.remove('fame-form--submitting', 'fame-form--submitted')
		this.#setSubmitting(false)
	}

	/**
	 * Get submit URL.
	 *
	 * @private
	 */
	getSubmitUrl() {
		const url = new URL(`${this.#url}/donation/${encodeURIComponent(this.#slug)}`)

		// @todo move contact parameter to form.
		// Check if contact form should be required.
		const contact = this.#form.querySelector('[data-contact]')
		if (contact instanceof HTMLElement && !!contact.dataset.contact) {
			url.searchParams.append('contact', '1')
		}

		return url
	}
}
