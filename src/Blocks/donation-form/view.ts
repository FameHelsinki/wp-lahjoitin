import domReady from '@wordpress/dom-ready'
import { __, sprintf } from '@wordpress/i18n'
import FormHandler from './view/FormHandler.ts'

import './view.css'

domReady(() => {
	const { backend_url: backendUrl, slug } = window.fame_lahjoitukset || {}
	if (!backendUrl) {
		throw new Error('Backend URL is missing')
	}
	if (!slug) {
		throw new Error('Slug is missing')
	}

	const form = document.querySelector<HTMLFormElement>('form.fame-form--donations')
	if (!form) return

	const translations = {
		errors: {
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
		},
		amount: {
			min: (min: number, unit: string) =>
				sprintf(
					/* translators: %1$s: minimum amount, %2$s: currency symbol */
					__('The minimum donation amount is %1$s%2$s.', 'fame_lahjoitukset'),
					min,
					unit
				),
			max: (max: number, unit: string) =>
				sprintf(
					/* translators: %1$s: maximum amount, %2$s: currency symbol */
					__('The maximum donation amount is %1$s%2$s.', 'fame_lahjoitukset'),
					max,
					unit
				),
		},
	}

	new FormHandler(backendUrl, slug, form, translations)
})
