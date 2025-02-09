<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;
use Fame\WordPress\Lahjoitukset\DI\ContainerInjectionInterface;
use Psr\Container\ContainerInterface;

/**
 * Gutenberg component.
 */
class Blocks implements ComponentInterface, ContainerInjectionInterface
{

	/**
	 * Constructs a new instance.
	 */
	public final function __construct(private Settings $settings)
	{
	}


	/**
	 * {@inheritDoc}
	 */
	public static function create(ContainerInterface $container): self
	{
		return new static(
			$container->get(Settings::class),
		);
	}

	/**
	 * Called when block is registered.
	 */
	public function onBlockRegister(\WP_Block_Type $block): void
	{
		if ($block->name === 'famehelsinki/donation-form') {
			if (empty($block->view_script_handles)) {
				return;
			}

			$viewScript = reset($block->view_script_handles);

			wp_localize_script($viewScript, 'fame_lahjoitukset', [
				'backend_url' => $this->settings->getBackendUrl(),
			]);
		}
	}


    /**
     * Init Gutenberg component.
     */
    #[Action('init')]
    public function registerBlockTypes(): void
    {
        if (file_exists(LAHJOITUKSET_PLUGIN_PATH . 'build/Blocks')) {
            $block_json_files = glob(LAHJOITUKSET_PLUGIN_PATH . 'build/Blocks/*/block.json');

            // Auto register all blocks found in the `build/blocks` folder.
            foreach ($block_json_files as $filename) {
                $block_folder = dirname($filename);

                // https://developer.wordpress.org/reference/functions/register_block_type/
                $block = register_block_type($block_folder);

                $this->onBlockRegister($block);
            }
        }
    }
}
