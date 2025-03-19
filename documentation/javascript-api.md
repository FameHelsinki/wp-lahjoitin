# Javascript API

Form API is implemented with custom events.

## Events

### `fame-lahjoitukset-submit`

This custom event is dispatched when the form is submitted. It provides a way for plugins or
other scripts to interact with the form data before it is sent to the backend. This event can
also be used to cancel the form submission process by calling event.preventDefault() on the event.

- Detail: An object containing the following properties:
  - data: The form data submitted as an object, where the key is the field name, and the value is the corresponding form data.
  - form: The instance of the FormHandler class responsible for the form.
  - errors: An empty array by default, which can be populated if validation errors are found before submission.

#### Example Usage:

```js
window.addEventListener('fame-lahjoitukset-submit', (event) => {
	const params = new URLSearchParams(document.location.search);

	// Validate custom element.
	if (!event.detail.handler.form.getElementById('#tos_checkbox').checked) {
		event.detail.handler.addError('tos_checkbox', 'You must agree to terms of service.');
		event.preventDefault()
		return;
	}

	// Modify the form data before submission.
	event.detail.data.campaign = params.get('utm_campaign');
})
```
