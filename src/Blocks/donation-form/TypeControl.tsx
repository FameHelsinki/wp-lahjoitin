import React, { FC } from 'react'
import { SelectControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { DONATION_TYPES } from '../common/DonationType.ts'

type Props = {
	types?: string[]
	onChange: (types: string[]) => void
}

const TypeControl: FC<Props> = ({ types, onChange }) => (
	<>
		<SelectControl
			multiple={true}
			label={__('Enabled donation types', 'fame_lahjoitukset')}
			help={__(
				'Donation types that can be used with this form. Selecting multiple options is allowed.',
				'fame_lahjoitukset'
			)}
			value={types}
			options={DONATION_TYPES}
			onChange={onChange}
		/>
	</>
)

export default TypeControl
