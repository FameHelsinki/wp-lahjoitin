import React from 'react'
import {TextControl} from "@wordpress/components";
import {__} from "@wordpress/i18n";
import {formatAmount} from "../common/utils.ts";

type Props = {
	setAttributes: (attributes: any) => void;
}

/**
 * Controls settings for single donation type.
 *
 * The exposed settings are:
 *  - Donation amounts (if amount component is enabled)
 *  - Default donation amount
 *  - Enabled providers (if provider component is enabled)
 *    Default provider
 */
const DonationTypeControls: React.FC<Props> = ({ setAttributes }) => {
	const defaultAmount = 100;

	return <>
		<TextControl
			label={__('Default amount', 'fame_lahjoitukset')}
			help={__(
				'Default donation amount.',
				'fame_lahjoitukset'
			)}
			value={defaultAmount}
			onChange={(value) => setAttributes({ defaultAmount: formatAmount(value) })}
		/>
	</>

}

export default DonationTypeControls
