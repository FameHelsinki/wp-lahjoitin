import React, { useEffect, useRef } from 'react'
import {
	InspectorAdvancedControls,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor'
import {
	BaseControl,
	Button,
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components'
import { useSelect } from '@wordpress/data'
import { __ } from '@wordpress/i18n'
import { create, getTextContent, toHTMLString } from '@wordpress/rich-text'
import type { Block } from '@wordpress/blocks'
import type { EditProps } from '../common/types'
import { FORM_BLOCK } from '../donation-form/insertion'
import {
	additionalFields,
	FIELD_KEY_CONFLICTS_CONTEXT,
	FIELD_KEY_PREFIX,
	fieldChoices,
	fieldKeySuffix,
	fieldProblem,
	generateFieldKey,
	type FieldAttributes,
} from './fields'

export default function Edit({
	attributes,
	clientId,
	context,
	setAttributes,
}: EditProps<FieldAttributes>) {
	const { fieldType, fieldKey, label, helpText, required } = attributes
	const choices = fieldChoices(attributes.choices)
	const { formBlocks, isSaving } = useSelect(
		select => {
			const editor = select(blockEditorStore)
			const [formId] = editor.getBlockParentsByBlockName(clientId, FORM_BLOCK)
			const posts = select('core/editor') as
				| { isSavingPost?: () => boolean; isAutosavingPost?: () => boolean }
				| undefined
			return {
				formBlocks: formId ? (editor.getBlocks(formId) as Block[]) : null,
				isSaving: !!posts?.isSavingPost?.() && !posts?.isAutosavingPost?.(),
			}
		},
		[clientId]
	)
	const fields = additionalFields(formBlocks ?? [])
	const conflictingFieldIds: string[] | undefined = context[FIELD_KEY_CONFLICTS_CONTEXT]
	const problem =
		fieldProblem(attributes) ??
		(conflictingFieldIds?.includes(clientId)
			? __(
					'This field key is already used. Clear this field’s key in Advanced to generate a new one.',
					'fame_lahjoitukset'
				)
			: undefined)
	const generatingKey = useRef(false)
	useEffect(() => {
		if (isSaving) generatingKey.current = false
	}, [isSaving])

	const changeLabel = (value: string) => {
		if (fieldKey && !generatingKey.current) {
			setAttributes({ label: value })
			return
		}
		// Follow the first label edit until the input is left or the post is saved.
		generatingKey.current = true
		setAttributes({ label: value, fieldKey: generateFieldKey(value, fields, clientId) })
	}
	const finishLabelEdit = () => {
		generatingKey.current = false
	}

	const changeManualKey = (value: string) => {
		const suffix = fieldKeySuffix(value)
		setAttributes({ fieldKey: suffix ? `${FIELD_KEY_PREFIX}${suffix}` : '' })
	}

	const blockProps = useBlockProps({
		className: `fame-form__group${required ? ' fame-form__group--required' : ''}`,
	})
	const fieldId = `editor-additional-field-${clientId}`
	const keyControlId = `editor-additional-field-key-${clientId}`
	const editableLabel = (
		<RichText
			tagName="label"
			htmlFor={fieldId}
			className="fame-form__label"
			identifier="label"
			aria-label={__('Label', 'fame_lahjoitukset')}
			placeholder={__('Additional field', 'fame_lahjoitukset')}
			allowedFormats={[]}
			disableLineBreaks
			value={toHTMLString({ value: create({ text: label }) })}
			onChange={value => changeLabel(getTextContent(create({ html: value })))}
			onBlur={finishLabelEdit}
		/>
	)

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Additional field', 'fame_lahjoitukset')}>
					<SelectControl
						label={__('Field type', 'fame_lahjoitukset')}
						value={fieldType}
						options={[
							{ value: 'text', label: __('Text field', 'fame_lahjoitukset') },
							{ value: 'checkbox', label: __('Checkbox', 'fame_lahjoitukset') },
							{ value: 'select', label: __('Dropdown list', 'fame_lahjoitukset') },
						]}
						onChange={value =>
							setAttributes({ fieldType: value as FieldAttributes['fieldType'] })
						}
					/>
					<TextControl
						label={__('Label', 'fame_lahjoitukset')}
						value={label}
						onChange={changeLabel}
						onBlur={finishLabelEdit}
					/>
					<TextControl
						label={__('Help text', 'fame_lahjoitukset')}
						value={helpText}
						onChange={value => setAttributes({ helpText: value })}
					/>
					<ToggleControl
						label={__('Required field', 'fame_lahjoitukset')}
						checked={required}
						onChange={value => setAttributes({ required: value })}
					/>
				</PanelBody>
				{fieldType === 'select' && (
					<PanelBody title={__('Choices', 'fame_lahjoitukset')}>
						{choices.map((choice, index) => (
							<div key={index}>
								<TextControl
									label={__('Choice label', 'fame_lahjoitukset')}
									value={choice.label}
									onChange={value =>
										setAttributes({
											choices: choices.map((item, i) =>
												i === index ? { ...item, label: value } : item
											),
										})
									}
								/>
								<TextControl
									label={__('Stored value', 'fame_lahjoitukset')}
									help={__(
										'Leave empty to store the choice label.',
										'fame_lahjoitukset'
									)}
									value={choice.value}
									onChange={value =>
										setAttributes({
											choices: choices.map((item, i) =>
												i === index ? { ...item, value } : item
											),
										})
									}
								/>
								<Button
									variant="tertiary"
									onClick={() =>
										setAttributes({
											choices: choices.filter((_, i) => i !== index),
										})
									}
								>
									{__('Remove choice', 'fame_lahjoitukset')}
								</Button>
							</div>
						))}
						<Button
							variant="secondary"
							onClick={() =>
								setAttributes({ choices: [...choices, { label: '', value: '' }] })
							}
						>
							{__('Add choice', 'fame_lahjoitukset')}
						</Button>
					</PanelBody>
				)}
				{problem && (
					<Notice status="error" isDismissible={false}>
						{problem}
					</Notice>
				)}
			</InspectorControls>
			<InspectorAdvancedControls>
				<BaseControl
					id={keyControlId}
					label={__('Field key', 'fame_lahjoitukset')}
					help={__(
						'Enter your own key after custom_. Clear the field to generate a key from the label.',
						'fame_lahjoitukset'
					)}
				>
					<div className="fame-form__field-key" dir="ltr">
						<span aria-hidden="true">{FIELD_KEY_PREFIX}</span>
						<input
							id={keyControlId}
							aria-describedby={`${keyControlId}__help`}
							type="text"
							value={fieldKeySuffix(fieldKey)}
							spellCheck={false}
							autoCapitalize="none"
							onChange={event => changeManualKey(event.currentTarget.value)}
							onBlur={event => {
								if (!fieldKeySuffix(event.currentTarget.value)) {
									setAttributes({
										fieldKey: generateFieldKey(label, fields, clientId),
									})
								}
							}}
						/>
					</div>
				</BaseControl>
			</InspectorAdvancedControls>
			<div {...blockProps}>
				{fieldType === 'checkbox' ? (
					<div className="fame-form__custom-checkbox">
						<input id={fieldId} type="checkbox" disabled />
						{editableLabel}
					</div>
				) : (
					<>
						{editableLabel}
						{fieldType === 'select' ? (
							<select id={fieldId} className="fame-form__input" value="" disabled>
								<option value="">
									{__('Select an option', 'fame_lahjoitukset')}
								</option>
								{choices.map(
									(choice, index) =>
										choice.label.trim() && (
											<option
												key={index}
												value={choice.value.trim() || choice.label.trim()}
											>
												{choice.label}
											</option>
										)
								)}
							</select>
						) : (
							<input id={fieldId} className="fame-form__input" type="text" disabled />
						)}
					</>
				)}
				{helpText && <small className="fame-form__help">{helpText}</small>}
			</div>
		</>
	)
}
