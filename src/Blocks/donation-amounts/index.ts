/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
import { registerBlockType } from '@wordpress/blocks'

/**
 * Internal dependencies
 */
import Edit from './edit'
import save from './save'
import metadata from './block.json'
import './edit.css'
import SaveV1 from './deprecated/save-v1'
import BlockV1 from './deprecated/block-v1.json'
import { MAX_AMOUNT, MIN_AMOUNT } from '../common/donation-amount'

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
registerBlockType(metadata.name, {
	edit: Edit,
	save,

	deprecated: [
		{
			attributes: BlockV1.attributes,
			save: SaveV1,
			migrate: (attrs: any) => {
				const settings = Array.isArray(attrs?.settings)
					? attrs.settings.map((t: any) => ({
							...t,
							minAmount: t?.minAmount ?? MIN_AMOUNT,
							maxAmount: t?.maxAmount ?? MAX_AMOUNT,
						}))
					: attrs?.settings

				return {
					...attrs,
					settings,
				}
			},
		},
	],
} as any)
