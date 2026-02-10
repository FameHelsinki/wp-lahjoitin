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
import SaveV1 from './deprecated/save-v1'

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
registerBlockType(metadata.name, {
	/**
	 * @see ./edit.js
	 */
	edit: Edit,

	/**
	 * @see ./save.js
	 */
	save,

	/**
	 * Support old saved content (before submitLabelSingle/Recurring
	 * and before switching from RichText.Content to <button>)
	 */
	deprecated: [
		{
			attributes: {
				submitLabel: {
					type: 'string',
				},
			},

			// Migrate old attribute to new ones
			migrate: (attrs: { submitLabel?: string }) => ({
				submitLabel: attrs.submitLabel,
				submitLabelSingle: attrs.submitLabel,
				submitLabelRecurring: attrs.submitLabel,
			}),

			save: SaveV1,
		},
	],
} as any)
