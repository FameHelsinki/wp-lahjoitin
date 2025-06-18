/**
 * Donation/Payment provider handler.
 */
export default class ProviderHandler {
	#typeInputs: NodeListOf<HTMLInputElement>
	#providerSections: NodeListOf<HTMLElement>
	#providerRadios: NodeListOf<HTMLInputElement>
	#providerHiddens: NodeListOf<HTMLInputElement>
	#selectedProviderField?: HTMLInputElement
	#form?: HTMLFormElement

	constructor() {
		this.#typeInputs = document.querySelectorAll('input[name="type"]')
		this.#providerSections = document.querySelectorAll(
			'fieldset.payment-method-selector[data-type]'
		)
		this.#providerRadios = document.querySelectorAll('input[type="radio"][name="provider"]')
		this.#providerHiddens = document.querySelectorAll(
			'input[type="hidden"][name="provider"][data-type]'
		)
		this.#selectedProviderField = document.querySelector(
			'input[name="provider"][data-selected-provider]'
		)
		this.#form = document.querySelector('form.fame-form--donations')

		this.#bindEvents()
		this.#updateUI()
	}

	#bindEvents() {
		this.#typeInputs.forEach(i => i.addEventListener('change', this.#updateUI.bind(this)))
		this.#providerRadios.forEach(r => r.addEventListener('change', this.#updateUI.bind(this)))
		this.#form?.addEventListener('submit', () => {
			this.#updateUI()
		})
	}

	/**
	 * Updates the UI based on the selected provider type and provider.
	 */
	#updateUI() {
		const typeInputs = Array.from(this.#typeInputs)
		let selectedType = typeInputs.find(i => i.checked)?.value

		if (!selectedType && typeInputs.length === 1) {
			selectedType = typeInputs[0].value
		}

		if (!selectedType) {
			return
		}

		this.#providerSections.forEach(section => {
			const radios = section.querySelectorAll<HTMLInputElement>('input[type="radio"]')
			const isSingle = radios.length === 1

			if (isSingle) {
				section.style.display = 'none'
			} else if (section.dataset.type === selectedType) {
				section.style.display = 'block'
			} else {
				section.style.display = 'none'
			}
		})

		this.#providerHiddens.forEach(h => {
			h.disabled = h.dataset.type !== selectedType
		})

		if (this.#selectedProviderField) {
			const activeRadio = Array.from(this.#providerRadios).find(
				r =>
					r.closest(`fieldset[data-type="${selectedType}"]`) &&
					getComputedStyle(r.closest('fieldset')!).display !== 'none' &&
					r.checked
			)

			if (activeRadio) {
				this.#selectedProviderField.value = activeRadio.value
			} else {
				const activeHidden = Array.from(this.#providerHiddens).find(
					h => h.dataset.type === selectedType && !h.disabled
				)
				this.#selectedProviderField.value = activeHidden ? activeHidden.value : ''
			}
		}
	}
}
