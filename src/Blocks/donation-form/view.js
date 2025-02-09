import domReady from '@wordpress/dom-ready'

domReady(() => {
	const forms = document.querySelectorAll('.donation-form')

	async function submit(data) {
		const { backend_url: backendUrl } = window.fame_lahjoitukset

		const response = await fetch(`${backendUrl}/donation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		const result = await response.json()

		// @todo form validation.
		if (!response.ok) {
			throw new Error(result)
		}

		return result
	}

	for (const form of forms) {
		form.addEventListener('submit', event => {
			event.preventDefault()

			const data = Object.fromEntries(new FormData(form));
			console.log('FormData', data)

			// Amount must be in cents.
			data.amount = (data.amount * 100).toString()

			submit(data)
				.then(console.log)
				.catch(console.error)
		})
	}
})
