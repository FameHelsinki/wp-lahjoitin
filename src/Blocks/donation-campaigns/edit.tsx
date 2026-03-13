import React, { useState } from 'react'
import { __ } from '@wordpress/i18n'
import { InspectorControls, useBlockProps } from '@wordpress/block-editor'
import { PanelBody, TextControl, ToggleControl, Button } from '@wordpress/components'
import { EditProps } from '../common/types.ts'

const MAX_CAMPAIGNS = 10

type Attributes = {
	show: boolean
	campaigns: string[]
	label: string
	showLabel: boolean
}

export default function Edit({
	attributes,
	setAttributes,
}: EditProps<Attributes>): React.JSX.Element {
	const { show, campaigns, label, showLabel } = attributes

	const [newCampaign, setNewCampaign] = useState('')

	const addCampaign = () => {
		const trimmed = newCampaign.trim()
		if (!trimmed || campaigns.length >= MAX_CAMPAIGNS) return
		setAttributes({ campaigns: [...campaigns, trimmed] })
		setNewCampaign('')
	}

	const removeCampaign = (index: number) => {
		setAttributes({ campaigns: campaigns.filter((_, i) => i !== index) })
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'fame_lahjoitukset')}>
					<ToggleControl
						label={__('Show campaign selector', 'fame_lahjoitukset')}
						checked={show}
						onChange={value => setAttributes({ show: value })}
					/>

					{show && (
						<>
							<ToggleControl
								label={__('Show label', 'fame_lahjoitukset')}
								checked={showLabel}
								onChange={value => setAttributes({ showLabel: value })}
							/>
							<TextControl
								label={__('Label', 'fame_lahjoitukset')}
								value={label}
								onChange={value => setAttributes({ label: value })}
							/>

							<div>
								<p style={{ marginBottom: 4 }}>
									{__('Campaigns', 'fame_lahjoitukset')}
								</p>
								{campaigns.map((campaign, index) => (
									<div
										key={index}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 8,
											marginBottom: 4,
										}}
									>
										<span style={{ flex: 1 }}>{campaign}</span>
										<Button
											variant="secondary"
											size="small"
											onClick={() => removeCampaign(index)}
											aria-label={__('Remove campaign', 'fame_lahjoitukset')}
										>
											{__('Remove', 'fame_lahjoitukset')}
										</Button>
									</div>
								))}

								{campaigns.length < MAX_CAMPAIGNS ? (
									<div
										style={{
											display: 'flex',
											gap: 8,
											alignItems: 'flex-end',
											marginTop: 8,
										}}
									>
										<div style={{ flex: 1 }}>
											<TextControl
												label={__('New campaign', 'fame_lahjoitukset')}
												value={newCampaign}
												onChange={setNewCampaign}
												onKeyDown={(e: React.KeyboardEvent) => {
													if (e.key === 'Enter') {
														e.preventDefault()
														addCampaign()
													}
												}}
											/>
										</div>
										<Button
											variant="primary"
											onClick={addCampaign}
											disabled={!newCampaign.trim()}
											style={{ marginBottom: 8 }}
										>
											{__('Add', 'fame_lahjoitukset')}
										</Button>
									</div>
								) : (
									<p style={{ color: '#757575', fontSize: 12, marginTop: 8 }}>
										{__(
											'Maximum of 10 campaigns reached.',
											'fame_lahjoitukset'
										)}
									</p>
								)}
							</div>
						</>
					)}
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps()}>
				{show ? (
					<div className="fame-form__group">
						{showLabel && (
							<label htmlFor="campaigns-preview" className="fame-form__label">
								{label}
							</label>
						)}
						<select id="campaigns-preview" className="fame-form__input" disabled>
							{campaigns.length > 0 ? (
								campaigns.map((campaign, index) => (
									<option key={index} value={campaign}>
										{campaign}
									</option>
								))
							) : (
								<option value="">
									{__('No campaigns added yet', 'fame_lahjoitukset')}
								</option>
							)}
						</select>
					</div>
				) : (
					<div
						className="fame-form__hidden-placeholder"
						style={{ padding: 12, border: '1px dashed #ccc' }}
					>
						{__(
							'The campaign selector is not in use. Use the toggle in the sidebar to enable it.',
							'fame_lahjoitukset'
						)}
					</div>
				)}
			</div>
		</>
	)
}
