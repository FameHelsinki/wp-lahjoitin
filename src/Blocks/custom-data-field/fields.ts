import type { Block } from '@wordpress/blocks'
import { __ } from '@wordpress/i18n'
import metadata from './block.json'

type Choice = { label: string; value: string }

export type FieldAttributes = {
	fieldType: 'text' | 'checkbox' | 'select'
	fieldKey: string
	label: string
	helpText: string
	required: boolean
	choices: Choice[]
}

type FieldBlock = { clientId: string; attributes: FieldAttributes }

export const FIELD_KEY_CONFLICTS_CONTEXT = 'famehelsinki/fieldKeyConflicts'
export const FIELD_KEY_PREFIX = 'custom_'

const FIELD_KEY = /^[a-z0-9][a-z0-9_-]*$/

export function fieldKeySuffix(value: string): string {
	return value.trim().replace(/^(?:custom_)+/, '')
}

export function prefixedFieldKey(value: string): string {
	const suffix = fieldKeySuffix(value)
	return FIELD_KEY.test(suffix) ? `${FIELD_KEY_PREFIX}${suffix}` : ''
}

export function generateFieldKey(label: string, fields: FieldBlock[], clientId: string): string {
	if (!label.trim()) return ''
	const slug = label
		.normalize('NFKD')
		.toLowerCase()
		.replace(/\p{Mark}/gu, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
	const base = prefixedFieldKey(slug) || 'custom_field'
	const used = new Set(
		fields
			.filter(field => field.clientId !== clientId)
			.map(field => prefixedFieldKey(field.attributes.fieldKey))
	)
	return uniqueFieldKey(base, used)
}

export function uniqueFieldKey(base: string, used: ReadonlySet<string>): string {
	let key = base
	for (let suffix = 2; used.has(key); suffix++) {
		key = `${base}_${suffix}`
	}
	return key
}

export function additionalFields(blocks: Block[]): FieldBlock[] {
	return blocks.flatMap(block => {
		if (block.name === metadata.name) {
			return [{ clientId: block.clientId, attributes: block.attributes as FieldAttributes }]
		}
		return additionalFields(block.innerBlocks)
	})
}

export function fieldChoices(choices: FieldAttributes['choices']): Choice[] {
	return choices.map(choice => ({
		label: typeof choice?.label === 'string' ? choice.label : '',
		value: typeof choice?.value === 'string' ? choice.value : '',
	}))
}

export function fieldProblem(attributes: FieldAttributes): string | undefined {
	const { fieldKey, label, fieldType } = attributes
	if (!label.trim()) {
		return __('Enter a label for the additional field.', 'fame_lahjoitukset')
	}
	if (!prefixedFieldKey(fieldKey)) {
		return __(
			'Use lowercase letters, numbers, hyphens or underscores for the field key. Start with a letter or number.',
			'fame_lahjoitukset'
		)
	}
	if (fieldType === 'select') {
		const choices = fieldChoices(attributes.choices)
		const values = choices.map(choice => choice.value.trim() || choice.label.trim())
		if (!choices.length || choices.some(choice => !choice.label.trim())) {
			return __('Add at least one choice and give each choice a label.', 'fame_lahjoitukset')
		}
		if (new Set(values).size !== values.length) {
			return __('Each choice must have a different stored value.', 'fame_lahjoitukset')
		}
	}
}
