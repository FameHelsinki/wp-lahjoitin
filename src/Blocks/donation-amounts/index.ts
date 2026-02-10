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
			attributes: {
				settings: { type: 'array' },
				other: { type: 'boolean' },
				otherLabel: { type: 'string' },
				showLegend: { type: 'boolean' },
				legend: { type: 'string' },
			},
			save: SaveV1,
		},
	],
} as any)
