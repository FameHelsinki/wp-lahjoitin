export type AmountMessages = {
	min: (min: number, unit: string) => string
	max: (max: number, unit: string) => string
}

export const defaultAmountMessages: AmountMessages = {
	min: (min, unit) => `The minimum donation amount is ${min}${unit}.`,
	max: (max, unit) => `The maximum donation amount is ${max}${unit}.`,
}

export class AmountWrapper {
	readonly #onChange: (amount: number) => void
	readonly #messages: AmountMessages
	readonly #wrapper: HTMLElement
	readonly #buttons: NodeListOf<HTMLInputElement>
	readonly #other: HTMLInputElement | null
	readonly #otherWrapper: HTMLElement | null
	readonly #announcer: HTMLElement | null

	#invalidOther = false
	#announcedMessage = ''
	#externalErrorControl: HTMLInputElement | null = null
	#disabled = false

	get type() {
		return this.#wrapper.dataset.type
	}

	set disabled(value: boolean) {
		this.#disabled = value
		this.#wrapper.style.display = value ? 'none' : ''
		this.#buttons.forEach(button => {
			button.disabled = value
		})

		if (this.#otherWrapper) {
			this.#otherWrapper.style.display = value ? 'none' : ''
		}
		if (this.#other) {
			this.#other.disabled = value
		}

		// When hiding this wrapper (type switch), clear its invalid state & re-enable submit.
		if (value) {
			this.#resetInvalid()
		}
	}

	get disabled() {
		return this.#disabled
	}

	get invalid() {
		return this.#invalidOther || this.#externalErrorControl !== null
	}

	/** Show a backend error on the visible control that represents the amount. */
	addError(message: string): boolean {
		if (this.#disabled) return false

		const checked = Array.from(this.#buttons).find(button => button.checked)
		const control = checked ?? this.#other ?? this.#buttons[0]
		if (!control) return false

		this.#clearExternalError()
		this.#externalErrorControl = control
		this.#showError(control, message)
		this.#notifyValidityChange(true)
		return true
	}

	get value() {
		// Other is kept in sync with radio buttons.
		if (this.#other) {
			return parseInt(this.#other.value)
		}

		// Return value from selected radio button.
		return parseInt(Array.prototype.find.call(this.#buttons, button => button.checked)?.value)
	}

	#resetInvalid() {
		this.#invalidOther = false
		this.#clearExternalError()

		if (this.#other) {
			this.#syncOtherValueText()
			this.#clearError(this.#other)
		}

		this.#notifyValidityChange(false)
	}

	/**
	 * Ensure that default amount is selected when save() doesn't output `checked`.
	 * Priority:
	 * 1) Keep existing selection (legacy checked or user interaction)
	 * 2) Select amount from data-default-amount (and set other input to it if present)
	 * 3) Fallback: first radio
	 */
	ensureSelection(): number {
		// 1) Keep current selection if any (legacy markup might have `checked`).
		const selected = Array.prototype.find.call(this.#buttons, button => button.checked) as
			| HTMLInputElement
			| undefined
		if (selected) {
			const amount = parseInt(selected.value) || 0
			if (this.#other) {
				this.#other.value = amount.toString()
				this.#resetInvalid()
			}
			return amount
		}

		// 2) Try default from wrapper dataset (data-default-amount).
		const defaultAmountRaw = this.#wrapper.dataset.defaultAmount
		const defaultAmount = defaultAmountRaw ? parseInt(defaultAmountRaw) : NaN

		if (!Number.isNaN(defaultAmount) && defaultAmount > 0) {
			// Prefer matching radio if exists.
			const match = Array.prototype.find.call(
				this.#buttons,
				(button: HTMLInputElement) => button.value === defaultAmount.toString()
			) as HTMLInputElement | undefined

			if (match) {
				match.checked = true
				if (this.#other) {
					this.#other.value = defaultAmount.toString()
					this.#resetInvalid()
				}
				return defaultAmount
			}

			// If no matching radio exists but "other" input exists, set it.
			if (this.#other) {
				this.#other.value = defaultAmount.toString()
				this.#resetInvalid()
				return defaultAmount
			}
		}

		// 3) Fallback: first radio.
		const first = this.#buttons[0]
		if (first) {
			first.checked = true
			const amount = parseInt(first.value) || 0
			if (this.#other) {
				this.#other.value = amount.toString()
				this.#resetInvalid()
			}
			return amount
		}

		// Last fallback: if only other exists, keep its value (or 0).
		if (this.#other) {
			return parseInt(this.#other.value) || 0
		}

		return 0
	}

	constructor(
		wrapper: HTMLElement,
		onChange: (amount: number) => void,
		messages: AmountMessages = defaultAmountMessages,
		announcer: HTMLElement | null = null
	) {
		const onChangeButton = this.#onChangeButton.bind(this)

		this.#onChange = onChange
		this.#messages = messages
		this.#announcer = announcer
		this.#wrapper = wrapper
		this.#buttons = wrapper.querySelectorAll('input[type="radio"]')
		this.#buttons.forEach(radio => {
			// AmountHandler owns validation for the complete amount selector.
			radio.dataset.customValidator = ''
			radio.addEventListener('change', onChangeButton)
		})
		this.#other = this.#findOtherInput(wrapper)
		this.#other?.addEventListener('input', this.#onChangeOther.bind(this))
		this.#other?.addEventListener('focusout', this.#onLeaveOther.bind(this))
		this.#otherWrapper = this.#findOtherWrapper(wrapper)
		this.#syncOtherValueText()
	}

	/** Expose the amount and unit instead of a percentage of the numeric range. */
	#syncOtherValueText(): void {
		if (!this.#other) return
		if (this.#other.value === '') {
			this.#other.removeAttribute('aria-valuetext')
			return
		}
		this.#other.setAttribute(
			'aria-valuetext',
			`${this.#other.value} ${this.#getUnit(this.#other)}`.trim()
		)
	}

	#findOtherWrapper(wrapper: HTMLElement): HTMLElement | null {
		const parent = wrapper.parentElement
		if (!parent) return null

		const type = wrapper.dataset.type
		if (type) {
			const el = parent.querySelector(`.donation-amounts__other[data-type="${type}"]`)
			return el instanceof HTMLElement ? el : null
		}

		const el = parent.querySelector('.donation-amounts__other')
		return el instanceof HTMLElement ? el : null
	}

	#findOtherInput(wrapper: HTMLElement): HTMLInputElement | null {
		const inside = wrapper.querySelector('input[type="number"]')
		if (inside instanceof HTMLInputElement) return inside

		const parent = wrapper.parentElement
		if (!parent) return null

		const type = wrapper.dataset.type
		if (!type) return null

		const other = parent.querySelector(
			`.donation-amounts__other[data-type="${type}"] input[type="number"]`
		)

		return other instanceof HTMLInputElement ? other : null
	}

	#notifyValidityChange(invalid: boolean) {
		this.#wrapper.dispatchEvent(
			new CustomEvent('fame-lahjoitukset-amount-validity', {
				bubbles: true,
				detail: { invalid },
			})
		)
	}

	#getUnit(input: HTMLInputElement) {
		const other = input.closest('.donation-amounts__other')
		return other?.querySelector('.donation-amounts__unit')?.textContent?.trim() ?? ''
	}

	#getErrorEl(input: HTMLInputElement) {
		const wrapper = input.closest('.donation-amounts__input-wrapper') ?? this.#wrapper

		let el = wrapper.querySelector('.donation-amounts__error') as HTMLElement | null
		if (!el) {
			el = document.createElement('div')
			el.className = 'donation-amounts__error'
			el.id = `${input.id || input.name}-error`
			wrapper.appendChild(el)
		}
		return el
	}

	#showError(input: HTMLInputElement, message: string) {
		const el = this.#getErrorEl(input)
		if (el) {
			if (el.textContent !== message) {
				el.textContent = message
			}
			for (const control of input.type === 'radio' ? Array.from(this.#buttons) : [input]) {
				this.#addDescription(control, el.id)
				control.setAttribute('aria-invalid', 'true')
			}
		}
	}

	#clearError(input: HTMLInputElement) {
		const el = this.#getErrorEl(input)
		if (el) {
			if (el.textContent !== '') {
				el.textContent = ''
			}
			this.#clearAnnouncement()
			for (const control of input.type === 'radio' ? Array.from(this.#buttons) : [input]) {
				this.#removeDescription(control, el.id)
				control.removeAttribute('aria-invalid')
			}
		}
	}

	#clearAnnouncement() {
		if (this.#announcedMessage && this.#announcer?.textContent === this.#announcedMessage) {
			this.#announcer.textContent = ''
		}
		this.#announcedMessage = ''
	}

	#onLeaveOther() {
		if (!this.#other || !this.#invalidOther || !this.#announcer) return
		const message = this.#getErrorEl(this.#other)?.textContent?.trim()
		if (!message) return
		const label = this.#other.labels?.[0]?.textContent?.trim() ?? this.#other.name
		const announcement = `${label}: ${message}`
		if (this.#announcer.textContent !== announcement) {
			this.#announcer.textContent = announcement
		}
		this.#announcedMessage = announcement
	}

	#clearExternalError() {
		if (!this.#externalErrorControl) return
		this.#clearError(this.#externalErrorControl)
		this.#externalErrorControl = null
	}

	#addDescription(input: HTMLInputElement, id: string) {
		const ids = new Set(input.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [])
		ids.delete('')
		ids.add(id)
		input.setAttribute('aria-describedby', Array.from(ids).join(' '))
	}

	#removeDescription(input: HTMLInputElement, id: string) {
		const ids = (input.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []).filter(
			current => current !== '' && current !== id
		)
		if (ids.length > 0) {
			input.setAttribute('aria-describedby', ids.join(' '))
		} else {
			input.removeAttribute('aria-describedby')
		}
	}

	#onChangeOther(event: Event) {
		const target = event.target
		if (!(target instanceof HTMLInputElement)) return

		this.#clearAnnouncement()
		const amount = parseInt(target.value) || 0
		this.#clearExternalError()

		// Only allow numbers.
		target.value = amount.toString()
		this.#syncOtherValueText()

		// Validate min/max from HTML attributes.
		const min = parseInt(target.min || '')

		const unit = this.#getUnit(target)

		if (!Number.isNaN(min) && amount < min) {
			this.#invalidOther = true
			this.#notifyValidityChange(true)
			this.#showError(target, this.#messages.min(min, unit))
			return
		}

		const max = parseInt(target.max || '')

		if (!Number.isNaN(max) && amount > max) {
			this.#invalidOther = true
			this.#notifyValidityChange(true)
			this.#showError(target, this.#messages.max(max, unit))
			return
		}

		this.#invalidOther = false
		this.#clearError(target)
		this.#notifyValidityChange(false)

		// Select radiobuttons that have the selected amount.
		this.#buttons.forEach(button => {
			button.checked = button.value === target.value
		})

		this.#onChange(amount)
	}

	#onChangeButton(event: Event) {
		const target = event.target
		if (!(target instanceof HTMLInputElement)) return

		const amount = target.value
		this.#clearExternalError()

		// Keep other amount in sync.
		if (this.#other) {
			this.#invalidOther = false
			this.#clearError(this.#other)
			this.#other.value = amount
			this.#syncOtherValueText()
			this.#notifyValidityChange(false)
		}

		this.#onChange(parseInt(amount))
	}
}

/**
 * Donation amount handler.
 */
export default class AmountHandler {
	readonly #amount: HTMLInputElement
	readonly #wrappers: AmountWrapper[] = []

	get amount() {
		return parseInt(this.#amount.value) / 100
	}

	get invalid() {
		return this.#isInvalid()
	}

	/** Attach a backend amount error to the currently visible amount control. */
	addError(message: string): boolean {
		const active = this.#wrappers.find(wrapper => !wrapper.disabled)
		return active?.addError(message) ?? false
	}

	set amount(value: number) {
		// Amount should be in cents.
		this.#amount.value = (value * 100).toString()
	}

	constructor(form: HTMLFormElement, messages: AmountMessages = defaultAmountMessages) {
		const amount = form.elements.namedItem('amount')
		if (!(amount instanceof HTMLInputElement)) {
			throw new Error('Missing amount element')
		}

		this.#amount = amount

		const onChangeAmount = this.#onChangeAmount.bind(this)
		const onChangeType = this.#onChangeType.bind(this)
		const announcer = form.querySelector<HTMLElement>('.fame-form__validation-announcer')

		form.querySelectorAll('.donation-amounts').forEach(wrapper => {
			if (wrapper instanceof HTMLElement) {
				this.#wrappers.push(new AmountWrapper(wrapper, onChangeAmount, messages, announcer))

				const eventTarget: any = wrapper
				eventTarget.addEventListener('fame-lahjoitukset-change', onChangeAmount)
			}
		})

		const types = form.elements.namedItem('type')

		// RadioNodeList (normal case)
		if (types instanceof RadioNodeList) {
			types.forEach(radio => radio.addEventListener('change', onChangeType))

			// Ensure that state is up to date.
			const selected = Array.prototype.find.call(types, (t: any) => t?.checked) as
				| HTMLInputElement
				| undefined

			if (selected?.value) {
				this.#updateType(selected.value)
			} else {
				// Fallback: if nothing checked, still try first value if exists
				const first = types[0] as any as HTMLInputElement | undefined
				if (first?.value) this.#updateType(first.value)
			}
		}

		// Hidden input for single-type forms.
		else if (types instanceof HTMLInputElement && types.value) {
			this.#updateType(types.value)
		}

		// No type field at all: if there is exactly one wrapper, initialize it
		else if (this.#wrappers.length === 1) {
			const selectedAmount = this.#wrappers[0].ensureSelection()
			this.#onChangeAmount(selectedAmount)
		}

		// Extra safety: if submit is attempted while invalid, block it.
		form.addEventListener(
			'submit',
			event => {
				if (this.#isInvalid()) {
					event.preventDefault()
				}
			},
			true
		)
	}

	#isInvalid() {
		return this.#wrappers.some(w => !w.disabled && w.invalid)
	}

	#onChangeType(event: Event) {
		const target = event.target
		if (target instanceof HTMLInputElement) {
			this.#updateType(target.value)
		}
	}

	#onChangeAmount(amount: number) {
		this.amount = amount
	}

	#updateType(type: string) {
		this.#wrappers.forEach(wrapper => {
			const disabled = (wrapper.disabled = wrapper.type !== type)
			if (!disabled) {
				const amount = wrapper.ensureSelection()
				this.#onChangeAmount(amount)
			}
		})
	}
}
