<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;

/**
 * Gutenberg component.
 */
class Blocks implements ComponentInterface
{

    /**
     * Init Gutenberg component.
     */
    #[Action('init')]
    public function registerBlockTypes(): void
    {
        if (file_exists(LAHJOITUKSET_PLUGIN_PATH . 'build/Blocks')) {
            $block_json_files = glob(LAHJOITUKSET_PLUGIN_PATH . 'build/Blocks/*/block.json');

            // Autoregister all blocks found in the `build/blocks` folder.
            foreach ($block_json_files as $filename) {
                $block_folder = dirname($filename);

                // https://developer.wordpress.org/reference/functions/register_block_type/
                register_block_type($block_folder);
            }
        }
    }
}
