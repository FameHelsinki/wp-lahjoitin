document.addEventListener('DOMContentLoaded', () => {
	const typeInputs = document.querySelectorAll<HTMLInputElement>('input[name="type"]')
	const providerRows = document.querySelectorAll<HTMLElement>(
		'.payment-method-selector [data-type]'
	)

	const updateVisibleProviders = () => {
		const selectedType = document.querySelector<HTMLInputElement>(
			'input[name="type"]:checked'
		)?.value
		if (!selectedType) return

		providerRows.forEach(row => {
			row.style.display = row.dataset.type === selectedType ? 'inline-block' : 'none'
		})
	}

	typeInputs.forEach(input => input.addEventListener('change', updateVisibleProviders))
	updateVisibleProviders()
})
