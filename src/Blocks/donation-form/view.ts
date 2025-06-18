import domReady from '@wordpress/dom-ready'
import { __ } from '@wordpress/i18n'
import FormHandler from './view/FormHandler.ts'

import './view.css'

domReady(() => {
	const { backend_url: backendUrl } = window.fame_lahjoitukset || {}
	if (!backendUrl) {
		throw new Error('Backend URL is missing')
	}

	const form = document.querySelector<HTMLFormElement>('form.fame-form--donations')
	if (!form) return

	const translations = {
		amount: {
			unknown: __('Invalid amount', 'fame_lahjoitukset'),
		},
		first_name: {
			required: __('First name is required', 'fame_lahjoitukset'),
			unknown: __('Invalid first name', 'fame_lahjoitukset'),
		},
		last_name: {
			required: __('Last name is required', 'fame_lahjoitukset'),
			unknown: __('Invalid last name', 'fame_lahjoitukset'),
		},
		email: {
			required: __('Email is required', 'fame_lahjoitukset'),
			unknown: __('Invalid email', 'fame_lahjoitukset'),
		},
		phone: {
			unknown: __('Invalid phone number', 'fame_lahjoitukset'),
		},
	}

	new FormHandler(backendUrl, form, translations)
})
