class AmountWrapper {
	readonly #onChange: (amount: number) => void
	readonly #wrapper: HTMLElement
	readonly #buttons: NodeListOf<HTMLInputElement>
	readonly #other: HTMLInputElement | null

	get type() {
		return this.#wrapper.dataset.type
	}

	set disabled(value: boolean) {
		this.#wrapper.style.display = value ? 'none' : ''
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
		this.#other = wrapper.querySelector('input[type="number"]')
		this.#other?.addEventListener('input', this.#onChangeOther.bind(this))
	}

	#onChangeOther(event: Event) {
		const target= event.target
		if (target instanceof HTMLInputElement) {
			const amount = parseInt(target.value) || 0

			// Only allow numbers.
			target.value = amount.toString()

			// Select radiobuttons that have the selected amount.
			this.#buttons.forEach(button => {
				button.checked = (button.value === target.value)
			})

			this.#onChange(amount)
		}
	}

	#onChangeButton(event: Event) {
		const target= event.target
		if (target instanceof HTMLInputElement) {
			const amount = target.value;

			// Keep other amount in sync.
			if (this.#other) {
				this.#other.value = amount
			}

			this.#onChange(parseInt(amount))
		}
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

		const onChangeAmount= this.#onChangeAmount.bind(this)
		const onChangeType = this.#onChangeType.bind(this)

		form
			.querySelectorAll('.donation-amounts')
			.forEach(wrapper => {
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
	}

	#onChangeType(event: Event) {
		const target = event.target
		if (target instanceof HTMLInputElement) {
			this.#updateType(target.value)
		}
	}

	#onChangeAmount(amount: number) {
		this.amount = amount * 100
	}

	#updateType(type: string) {
		this.#wrappers.forEach(wrapper => {
			const disabled = wrapper.disabled = wrapper.type !== type
			if (!disabled) {
				this.#onChangeAmount(wrapper.value || 0)
			}
		})
	}

}
