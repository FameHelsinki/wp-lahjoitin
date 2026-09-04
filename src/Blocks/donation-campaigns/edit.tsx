import React, { useState } from 'react'
import { __ } from '@wordpress/i18n'
import { InspectorControls, useBlockProps } from '@wordpress/block-editor'
import { PanelBody, TextControl, ToggleControl, Button } from '@wordpress/components'
import { EditProps } from '../common/types.ts'
import { localizedDefault } from '../common/localized-default.ts'

const MAX_CAMPAIGNS = 10

type Attributes = {
	campaigns: string[]
	label: string
	showLabel: boolean
}

export default function Edit({
	attributes,
	setAttributes,
}: EditProps<Attributes>): React.JSX.Element {
	const { campaigns, label, showLabel } = attributes
	const localizedLabel = localizedDefault(label, 'Campaign', __('Campaign', 'fame_lahjoitukset'))
	const hasCampaigns = campaigns.length > 0

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
						label={__('Show label', 'fame_lahjoitukset')}
						checked={showLabel}
						disabled={!hasCampaigns}
						onChange={value => setAttributes({ showLabel: value })}
					/>
					<TextControl
						label={__('Label', 'fame_lahjoitukset')}
						value={localizedLabel}
						disabled={!hasCampaigns}
						onChange={value => setAttributes({ label: value })}
					/>

					<div>
						<p style={{ marginBottom: 4 }}>{__('Campaigns', 'fame_lahjoitukset')}</p>
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
										__next40pxDefaultSize
										__nextHasNoMarginBottom
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
									__next40pxDefaultSize
									variant="primary"
									onClick={addCampaign}
									disabled={!newCampaign.trim()}
								>
									{__('Add', 'fame_lahjoitukset')}
								</Button>
							</div>
						) : (
							<p style={{ color: '#757575', fontSize: 12, marginTop: 8 }}>
								{__('Maximum of 10 campaigns reached.', 'fame_lahjoitukset')}
							</p>
						)}
					</div>
				</PanelBody>
			</InspectorControls>

			<div {...useBlockProps()}>
				<div className="fame-form__group">
					{campaigns.length <= 1 ? (
						<div>
							<div className="fame-form__label">
								{localizedLabel}
								{campaigns.length === 1 ? `: ${campaigns[0]}` : ''} (
								{__('hidden', 'fame_lahjoitukset')})
							</div>
							<p style={{ color: '#757575', fontSize: 12, margin: '4px 0 0' }}>
								{campaigns.length === 1
									? __(
											'Hidden because only one campaign is configured.',
											'fame_lahjoitukset'
										)
									: __(
											'Hidden because no campaigns are configured.',
											'fame_lahjoitukset'
										)}
							</p>
						</div>
					) : (
						<>
							{showLabel && (
								<label htmlFor="campaigns-preview" className="fame-form__label">
									{localizedLabel}
								</label>
							)}
							<select id="campaigns-preview" className="fame-form__input" disabled>
								{campaigns.map((campaign, index) => (
									<option key={index} value={campaign}>
										{campaign}
									</option>
								))}
							</select>
						</>
					)}
				</div>
			</div>
		</>
	)
}
