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
		$langPath = LAHJOITUKSET_PLUGIN_PATH . 'languages';

		// Register translations for all editor scripts.
		foreach ($block->editor_script_handles as $handle) {
			wp_set_script_translations($handle, 'fame_lahjoitukset', $langPath);
		}

		// Register translations for frontend scripts that have a valid registered src.
		// Handles with an empty src (e.g. block.json references a file that was not built)
		// trigger warnings in load_script_textdomain when wp_parse_url gets a bare domain URL.
		$wpScripts = wp_scripts();
		foreach ([...$block->view_script_handles, ...$block->script_handles] as $handle) {
			if (!empty($wpScripts->registered[$handle]->src ?? '')) {
				wp_set_script_translations($handle, 'fame_lahjoitukset', $langPath);
			}
		}

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
     * Load the plugin text domain with locale fallback support.
     *
     * WordPress's automatic plugin translation loading only looks in WP_LANG_DIR
     * and only resolves the exact locale. This method loads from the plugin's own
     * languages/ directory and falls back from a short locale (e.g. "fi") to its
     * full-locale variant (e.g. "fi_FI"), and vice versa, so the plugin works on
     * sites regardless of whether they use the short or full form.
     */
    #[Action('init')]
    public function loadTextdomain(): void
    {
        $locale  = determine_locale();
        $langDir = LAHJOITUKSET_PLUGIN_PATH . 'languages';

        foreach ($this->buildLocaleFallbacks($locale, $langDir) as $candidate) {
            if (load_textdomain('fame_lahjoitukset', "$langDir/fame_lahjoitukset-$candidate.mo", $candidate)) {
                return;
            }
        }
    }

    /**
     * Returns locale candidates to try, most specific first.
     *
     * - fi_FI  →  [fi_FI, fi]
     * - fi     →  [fi, fi_FI]  (fi_FI discovered by scanning available .mo files)
     */
    /** @return string[] */
    private function buildLocaleFallbacks(string $locale, string $langDir): array
    {
        $locales = [$locale];

        if (str_contains($locale, '_')) {
            // Full locale: append the short form (fi_FI → fi).
            $locales[] = strstr($locale, '_', true);
        } else {
            // Short locale: scan for available full-locale .mo files (fi → fi_FI).
            $pattern = $langDir . '/fame_lahjoitukset-' . $locale . '_*.mo';
            foreach (glob($pattern) ?: [] as $file) {
                $locales[] = substr(basename($file, '.mo'), strlen('fame_lahjoitukset-'));
            }
        }

        return array_unique($locales);
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

                if ($block instanceof \WP_Block_Type) {
                    $this->onBlockRegister($block);
                }
            }
        }
    }
}
