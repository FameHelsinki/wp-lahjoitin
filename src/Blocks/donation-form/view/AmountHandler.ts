import { __, sprintf } from '@wordpress/i18n'

export class AmountWrapper {
	readonly #onChange: (amount: number) => void
	readonly #wrapper: HTMLElement
	readonly #buttons: NodeListOf<HTMLInputElement>
	readonly #other: HTMLInputElement | null

	#invalidOther = false
	#disabled = false

	get type() {
		return this.#wrapper.dataset.type
	}

	set disabled(value: boolean) {
		this.#disabled = value
		this.#wrapper.style.display = value ? 'none' : ''
	}

	get disabled() {
		return this.#disabled
	}

	get invalid() {
		return this.#invalidOther
	}

	get value() {
		// Other is kept in sync with radio buttons.
		if (this.#other) {
			return parseInt(this.#other.value)
		}

		// Return value from selected radio button.
		return parseInt(Array.prototype.find.call(this.#buttons, button => button.checked)?.value)
	}

	constructor(wrapper: HTMLElement, onChange: (amount: number) => void) {
		const onChangeButton = this.#onChangeButton.bind(this)

		this.#onChange = onChange
		this.#wrapper = wrapper
		this.#buttons = wrapper.querySelectorAll('input[type="radio"]')
		this.#buttons.forEach(radio => radio.addEventListener('change', onChangeButton))
		this.#other = this.#findOtherInput(wrapper)
		this.#other?.addEventListener('input', this.#onChangeOther.bind(this))
	}

	#findOtherInput(wrapper: HTMLElement): HTMLInputElement | null {
		// If markup changes later and input becomes inside wrapper:
		const inside = wrapper.querySelector('input[type="number"]')
		if (inside instanceof HTMLInputElement) return inside

		// Current markup: sibling `.donation-amounts__other`
		const parent = wrapper.parentElement
		if (!parent) return null

		const other = parent.querySelector('.donation-amounts__other input[type="number"]')
		return other instanceof HTMLInputElement ? other : null
	}

	#setSubmitDisabled(disabled: boolean) {
		const form = this.#wrapper.closest('form')
		if (!form) return

		// Primary: your control block button
		const btn = form.querySelector('.fame-form__controls .wp-element-button')
		if (btn instanceof HTMLButtonElement) {
			btn.disabled = disabled
			if (disabled) btn.setAttribute('aria-disabled', 'true')
			else btn.removeAttribute('aria-disabled')
		}

		// Also cover generic submit buttons, just in case
		// form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach(b => {
		// 	if (b instanceof HTMLButtonElement || b instanceof HTMLInputElement) {
		// 		b.disabled = disabled
		// 		if (disabled) b.setAttribute('aria-disabled', 'true')
		// 		else b.removeAttribute('aria-disabled')
		// 	}
		// })
	}

	#getUnit(input: HTMLInputElement) {
		const other = input.closest('.donation-amounts__other')
		return other?.querySelector('.donation-amounts__unit')?.textContent?.trim() ?? ''
	}

	#getErrorEl(input: HTMLInputElement) {
		const wrapper = input.closest('.donation-amounts__input-wrapper')
		if (!wrapper) return null

		let el = wrapper.querySelector('.donation-amounts__error') as HTMLElement | null
		if (!el) {
			el = document.createElement('div')
			el.className = 'donation-amounts__error'
			el.setAttribute('role', 'alert')
			wrapper.appendChild(el)
		}
		return el
	}

	#showError(input: HTMLInputElement, message: string) {
		const el = this.#getErrorEl(input)
		if (el) el.textContent = message
		input.setAttribute('aria-invalid', 'true')
	}

	#clearError(input: HTMLInputElement) {
		const el = this.#getErrorEl(input)
		if (el) el.textContent = ''
		input.removeAttribute('aria-invalid')
	}

	#onChangeOther(event: Event) {
		const target = event.target
		if (!(target instanceof HTMLInputElement)) return

		const amount = parseInt(target.value) || 0

		// Only allow numbers.
		target.value = amount.toString()

		// Validate min/max from HTML attributes.
		const min = parseInt(target.min || '')

		const unit = this.#getUnit(target)

		if (!Number.isNaN(min) && amount < min) {
			this.#invalidOther = true
			this.#setSubmitDisabled(true)
			this.#showError(
				target,
				sprintf(
					/* translators: %1$s: amount, %2$s: currency symbol */
					__('Pienin mahdollinen lahjoitussumma on %1$s%2$s.', 'fame_lahjoitukset'),
					min,
					unit
				)
			)
			return
		}

		const max = parseInt(target.max || '')

		if (!Number.isNaN(max) && amount > max) {
			this.#invalidOther = true
			this.#setSubmitDisabled(true)
			this.#showError(
				target,
				sprintf(
					/* translators: %1$s: amount, %2$s: currency symbol */
					__('Suurin mahdollinen lahjoitussumma on %1$s%2$s.', 'fame_lahjoitukset'),
					max,
					unit
				)
			)
			return
		}

		this.#invalidOther = false
		this.#clearError(target)
		this.#setSubmitDisabled(false)

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

		// Keep other amount in sync.
		if (this.#other) {
			this.#invalidOther = false
			this.#clearError(this.#other)
			this.#other.value = amount
			this.#setSubmitDisabled(false)
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

	set amount(value: number) {
		// Amount should be in cents.
		this.#amount.value = (value * 100).toString()
	}

	constructor(form: HTMLFormElement) {
		const amount = form.elements.namedItem('amount')
		if (!(amount instanceof HTMLInputElement)) {
			throw new Error('Missing amount element')
		}

		this.#amount = amount

		const onChangeAmount = this.#onChangeAmount.bind(this)
		const onChangeType = this.#onChangeType.bind(this)

		form.querySelectorAll('.donation-amounts').forEach(wrapper => {
			if (wrapper instanceof HTMLElement) {
				this.#wrappers.push(new AmountWrapper(wrapper, onChangeAmount))

				const eventTarget: any = wrapper
				eventTarget.addEventListener('fame-lahjoitukset-change', onChangeAmount)
			}
		})

		const types = form.elements.namedItem('type')
		if (types instanceof RadioNodeList) {
			types.forEach(radio => radio.addEventListener('change', onChangeType))

			// Ensure that state is up to date.
			const selected = Array.prototype.find.call(types, type => type.checked)
			if (selected) {
				this.#updateType(selected.value)
			}
		}

		// Extra safety: if submit is attempted while invalid, block it.
		form.addEventListener(
			'submit',
			event => {
				if (this.#isInvalid()) {
					event.preventDefault()
					event.stopPropagation()
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
				this.#onChangeAmount(wrapper.value || 0)
			}
		})
	}
}
