import domReady from '@wordpress/dom-ready'
import FormHandler from './view/FormHandler.ts'

import './view.css'

domReady(() => {
	const { backend_url: backendUrl } = window.fame_lahjoitukset || {};
	if (!backendUrl) {
		throw new Error('Backend URL is missing')
	}

	document
		.querySelectorAll('form.fame-form--donations')
		.forEach(form => (form instanceof HTMLFormElement) && new FormHandler(backendUrl, form))
})
