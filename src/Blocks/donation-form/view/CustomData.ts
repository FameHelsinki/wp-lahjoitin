export type CustomData = Record<string, string | number | boolean | null>

// The backend measures the serialized object in UTF-8 bytes.
export const CUSTOM_DATA_MAX_BYTES = 4096

type Field = {
	key: string
	control: HTMLInputElement | HTMLSelectElement
}

export default class CustomDataFields {
	readonly #fields: Field[] = []

	constructor(form: HTMLFormElement) {
		for (const group of form.querySelectorAll<HTMLElement>('[data-custom-data-field]')) {
			const key = group.dataset.customDataField
			const control = group.querySelector<HTMLInputElement | HTMLSelectElement>(
				'input, select'
			)
			if (!key || !control || control.name !== `custom_data[${key}]`) continue
			this.#fields.push({ key, control })
		}
	}

	collect(data: Record<string, FormDataEntryValue>): CustomData | undefined {
		const values = new Map<string, string | boolean>()
		for (const { key, control } of this.#fields) {
			delete data[control.name]
			if (control.matches(':disabled')) continue
			if (control instanceof HTMLInputElement && control.type === 'checkbox') {
				if (control.checked) values.set(key, true)
			} else {
				const value = control.value.trim()
				if (value !== '') values.set(key, value)
			}
		}
		return values.size > 0 ? Object.fromEntries(values) : undefined
	}
}
