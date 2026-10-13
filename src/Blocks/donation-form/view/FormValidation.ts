import { ErrorTranslations, getErrorType } from './Validation.ts'

export type ValidatedFormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

type ValidityChangeCallback = (valid: boolean) => void

function isValidatedControl(
	element: EventTarget | Element | null
): element is ValidatedFormControl {
	return (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLSelectElement
	)
}

/**
 * Presents native constraint validation accessibly without showing errors while
 * the user is still entering a field for the first time.
 */
export default class FormValidation {
	readonly #form: HTMLFormElement
	readonly #translations: ErrorTranslations
	readonly #onValidityChange: ValidityChangeCallback
	readonly #announcer: HTMLElement | null
	readonly #touched = new WeakSet<ValidatedFormControl>()
	#announcedControl: ValidatedFormControl | null = null
	#announcedMessage = ''
	#bulkValidation = false

	constructor(
		form: HTMLFormElement,
		translations: ErrorTranslations = {},
		onValidityChange: ValidityChangeCallback = () => undefined
	) {
		this.#form = form
		this.#translations = translations
		this.#onValidityChange = onValidityChange
		this.#announcer = form.querySelector('.fame-form__validation-announcer')

		this.#form.addEventListener('focusout', this.#onFocusOut.bind(this))
		this.#form.addEventListener('input', this.#onInput.bind(this))
		this.#form.addEventListener('change', this.#onChange.bind(this))
	}

	get valid(): boolean {
		return this.#form.checkValidity()
	}

	/** Validate every enabled, visible form control and optionally focus the first error. */
	validateAll(focusFirst = false): boolean {
		let firstInvalid: ValidatedFormControl | null = null
		this.#bulkValidation = true
		this.#announcedControl = null
		this.#announcedMessage = ''
		if (this.#announcer) this.#announcer.textContent = ''

		for (const control of this.#controls()) {
			this.#touched.add(control)
			if (!this.#validateControl(control) && firstInvalid === null) {
				firstInvalid = control
			}
		}

		this.#form.classList.add('was-validated')
		this.#onValidityChange(firstInvalid === null)

		if (focusFirst && firstInvalid) {
			this.#focusControl(firstInvalid)
		}
		this.#bulkValidation = false

		return firstInvalid === null
	}

	/** Focus the first enabled control that currently exposes a validation error. */
	focusFirstInvalid(): boolean {
		const firstInvalid = Array.from(
			this.#form.querySelectorAll<ValidatedFormControl>('input, textarea, select')
		).find(
			control =>
				!control.disabled &&
				control.type !== 'hidden' &&
				control.getAttribute('aria-invalid') === 'true' &&
				!control.closest('[hidden]')
		)

		if (firstInvalid) this.#focusControl(firstInvalid)
		return firstInvalid !== undefined
	}

	#focusControl(control: ValidatedFormControl): void {
		let target = control
		if (control instanceof HTMLInputElement && control.type === 'radio') {
			const selected = this.#relatedControls(control).find(
				related => related instanceof HTMLInputElement && related.checked
			)
			if (selected) target = selected
		}

		if (this.#form.ownerDocument.activeElement === target) {
			this.#announceFocusedError(target)
		} else {
			target.focus()
		}
	}

	#announceFocusedError(control: ValidatedFormControl): void {
		if (!this.#announcer) return
		const ids = control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []
		const describedElements = Array.from(this.#form.querySelectorAll<HTMLElement>('[id]'))
		const error = ids
			.map(id => describedElements.find(element => element.id === id))
			.find(
				element =>
					element?.matches('.fame-form__feedback--invalid, .donation-amounts__error') &&
					element.textContent?.trim()
			)
		const message = error?.textContent?.trim()
		if (!message) return

		const label = this.#controlLabel(control)
		const announcement = `${label}: ${message}`
		if (this.#announcer.textContent !== announcement) {
			this.#announcer.textContent = announcement
		}
		this.#announcedControl = control
		this.#announcedMessage = announcement
	}

	#controlLabel(control: ValidatedFormControl): string {
		const label = control.labels?.[0]?.textContent?.trim()
		const legend = control
			.closest('fieldset')
			?.querySelector(':scope > legend')
			?.textContent?.trim()
		// A radio error belongs to the group, not to the individual option.
		if (control instanceof HTMLInputElement && control.type === 'radio') {
			return legend || label || control.name
		}
		return label || legend || control.name
	}

	/** Add an error returned by an integration or the donation API. */
	addError(name: string, error: string): boolean {
		const element = this.#form.elements.namedItem(name)
		let targetFound = false

		if (element instanceof RadioNodeList) {
			let first: HTMLInputElement | null = null
			Array.from(element).forEach(item => {
				if (!(item instanceof HTMLInputElement) || item.disabled || item.type === 'hidden')
					return
				first ??= item
				targetFound = true
				item.dataset.externalError = 'true'
				item.setCustomValidity(error)
				item.setAttribute('aria-invalid', 'true')
			})
			if (first) this.#showError(first, error, false)
		} else if (
			isValidatedControl(element) &&
			!element.disabled &&
			element.type !== 'hidden' &&
			element.type !== 'submit'
		) {
			targetFound = true
			element.dataset.externalError = 'true'
			element.setCustomValidity(error)
			this.#showError(element, error, false)
		}

		if (targetFound) this.#onValidityChange(false)
		return targetFound
	}

	#onFocusOut(event: FocusEvent): void {
		const control = event.target
		if (!isValidatedControl(control) || !this.#shouldValidate(control)) return
		// Radio groups are validated when a choice changes or the form is
		// submitted. Merely tabbing through a group must not create an error.
		if (control instanceof HTMLInputElement && control.type === 'radio') return

		this.#touched.add(control)
		this.#validateControl(control)
		this.#onValidityChange(this.valid)
	}

	#onInput(event: Event): void {
		const control = event.target
		if (!isValidatedControl(control)) return

		this.#clearAnnouncement(control)
		this.#clearExternalError(control)
		if (!this.#shouldValidate(control)) {
			this.#onValidityChange(this.valid)
			return
		}
		if (this.#touched.has(control) || control.getAttribute('aria-invalid') === 'true') {
			this.#validateControl(control)
		}
		this.#onValidityChange(this.valid)
	}

	#onChange(event: Event): void {
		const control = event.target
		if (!isValidatedControl(control)) return

		// Target listeners have already filtered fields for the selected type.
		const announcedControl = this.#announcedControl
		if (
			announcedControl &&
			(announcedControl.matches(':disabled') || announcedControl.closest('[hidden]'))
		) {
			this.#clearAnnouncement(announcedControl)
		}
		this.#clearAnnouncement(control)
		this.#clearExternalError(control)
		if (!this.#shouldValidate(control)) {
			this.#onValidityChange(this.valid)
			return
		}
		this.#touched.add(control)
		this.#validateControl(control)
		this.#onValidityChange(this.valid)
	}

	#clearExternalError(control: ValidatedFormControl): void {
		const named = control.name ? this.#form.elements.namedItem(control.name) : control
		let controls: ValidatedFormControl[] = [control]
		if (named instanceof RadioNodeList) {
			controls = Array.from(named).filter(isValidatedControl)
		} else if (isValidatedControl(named)) {
			controls = [named]
		}

		for (const current of controls) {
			if (current.dataset.externalError !== 'true') continue

			delete current.dataset.externalError
			current.setCustomValidity('')
			this.#clearError(current)
		}
	}

	#controls(): ValidatedFormControl[] {
		return Array.from(this.#form.elements).filter(
			(element): element is ValidatedFormControl =>
				isValidatedControl(element) && this.#shouldValidate(element)
		)
	}

	#shouldValidate(control: ValidatedFormControl): boolean {
		return (
			!control.disabled &&
			control.type !== 'hidden' &&
			control.type !== 'submit' &&
			control.dataset.customValidator === undefined
		)
	}

	#validateControl(control: ValidatedFormControl): boolean {
		if (control.validity.valid) {
			this.#clearError(control)
			return true
		}

		const message = control.validity.customError
			? control.validationMessage
			: this.#getErrorMessage(control.name, control.validity)
		this.#showError(control, message)
		return false
	}

	#showError(control: ValidatedFormControl, message: string, announce = true): void {
		const feedback = this.#getFeedback(control)
		feedback.classList.add('fame-form__feedback--invalid')
		if (feedback.textContent !== message) {
			feedback.textContent = message
			if (announce && !this.#bulkValidation && this.#announcer) {
				const label = this.#controlLabel(control)
				this.#announcedMessage = `${label}: ${message}`
				this.#announcer.textContent = this.#announcedMessage
				this.#announcedControl = control
			}
		}
		for (const relatedControl of this.#relatedControls(control)) {
			relatedControl.setAttribute('aria-invalid', 'true')
			this.#addDescription(relatedControl, feedback.id)
		}
	}

	#clearError(control: ValidatedFormControl): void {
		const feedback = this.#findFeedback(control)
		for (const relatedControl of this.#relatedControls(control)) {
			relatedControl.removeAttribute('aria-invalid')
			if (feedback) this.#removeDescription(relatedControl, feedback.id)
		}
		if (!feedback) return

		feedback.classList.remove('fame-form__feedback--invalid')
		if (feedback.textContent !== '') {
			feedback.textContent = ''
		}
		this.#clearAnnouncement(control)
	}

	#clearAnnouncement(control: ValidatedFormControl): void {
		if (!this.#announcedControl) return
		if (
			this.#announcedControl !== control &&
			!this.#relatedControls(control).includes(this.#announcedControl)
		) {
			return
		}
		if (this.#announcer?.textContent === this.#announcedMessage) {
			this.#announcer.textContent = ''
		}
		this.#announcedControl = null
		this.#announcedMessage = ''
	}

	#findFeedback(control: ValidatedFormControl): HTMLElement | null {
		const group = this.#feedbackContainer(control)
		const feedback = Array.from(
			group?.querySelectorAll<HTMLElement>('.fame-form__feedback[data-validation-for]') ?? []
		).find(element => element.dataset.validationFor === control.name)
		return feedback ?? null
	}

	#getFeedback(control: ValidatedFormControl): HTMLElement {
		const existing = this.#findFeedback(control)
		if (existing) return existing

		const feedback = document.createElement('span')
		feedback.id = `${control.id || control.name}-error`
		feedback.className = 'fame-form__feedback'
		feedback.dataset.validationFor = control.name
		this.#feedbackContainer(control)?.appendChild(feedback)
		return feedback
	}

	#feedbackContainer(control: ValidatedFormControl): HTMLElement | null {
		if (control instanceof HTMLInputElement && control.type === 'radio') {
			return control.closest('fieldset')
		}
		return control.closest('.fame-form__group') ?? control.parentElement
	}

	#relatedControls(control: ValidatedFormControl): ValidatedFormControl[] {
		if (!(control instanceof HTMLInputElement) || control.type !== 'radio') {
			return [control]
		}

		const fieldset = control.closest('fieldset')
		if (!fieldset) return [control]

		return Array.from(
			fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]')
		).filter(radio => radio.name === control.name && !radio.disabled)
	}

	#addDescription(control: ValidatedFormControl, id: string): void {
		const ids = new Set(control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [])
		ids.delete('')
		ids.add(id)
		control.setAttribute('aria-describedby', Array.from(ids).join(' '))
	}

	#removeDescription(control: ValidatedFormControl, id: string): void {
		const ids = (control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []).filter(
			current => current !== '' && current !== id
		)
		if (ids.length > 0) {
			control.setAttribute('aria-describedby', ids.join(' '))
		} else {
			control.removeAttribute('aria-describedby')
		}
	}

	#getErrorMessage(name: string, validity: ValidityState): string {
		const errorType = getErrorType(validity)
		return (
			this.#translations[name]?.[errorType] ??
			this.#translations[name]?.unknown ??
			this.#translations._default?.[errorType] ??
			this.#translations._default?.unknown ??
			'Invalid value'
		)
	}
}
