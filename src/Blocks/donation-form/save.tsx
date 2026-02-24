import React from 'react'
import { InnerBlocks } from '@wordpress/block-editor'

/**
 * This block is rendered dynamically on the server (render.php).
 *
 * We still need to output <InnerBlocks.Content /> so that child blocks
 * are saved into post_content. WordPress uses this serialized structure
 * to restore the block tree in the editor.
 *
 * The actual frontend markup is generated in PHP.
 */
export default function save() {
	return <InnerBlocks.Content />
}
