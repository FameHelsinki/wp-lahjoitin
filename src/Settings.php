<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;
use Fame\WordPress\Lahjoitukset\Settings\CheckboxField;
use Fame\WordPress\Lahjoitukset\Settings\TextField;
use Fame\WordPress\Lahjoitukset\Settings\Section;

/**
 * Settings component.
 */
class Settings implements ComponentInterface
{
    public const string MENU_SLUG = 'lahjoitukset';

    /**
     * Shared production backend host.
     */
    public const string PRODUCTION_URL = 'https://api.lahjoitin.fi';

    /**
     * Shared staging backend host for testing.
     */
    public const string STAGING_URL = 'https://api.staging.lahjoitin.fi';

    private Section $settings;

    /**
     * Constructs a new instance.
     */
    public function __construct() {
        $this->settings = new Section('fame_lahjoitukset_settings', 'Lahjoitukset settings');
        $this->settings
            ->addField(new TextField('slug'))
            ->addField(new CheckboxField('use_staging', ''));
    }

    /**
     * Run admin_menu action.
     */
    #[Action('admin_menu')]
    public function registerSettings(): void
    {
    	$this->settings
			->getField('slug')
			->setLabel(__('Slug', 'fame_lahjoitukset'))
			->setDescription(__('Your organization slug provided by lahjoitin.fi', 'fame_lahjoitukset'));

    	$this->settings
			->getField('use_staging')
			->setLabel(__('Use staging environment', 'fame_lahjoitukset'))
			->setDescription(__('Send donations to the staging/test environment for testing.', 'fame_lahjoitukset'));

        $this->settings->register(self::MENU_SLUG);

        \add_options_page(
            __('Fame lahjoitukset settings', 'fame_lahjoitukset'),
            __('Lahjoitukset', 'fame_lahjoitukset'),
            'manage_options',
            self::MENU_SLUG,
            function () { ?>
                <form method="post" action="options.php">
                    <?php settings_fields($this->settings->sectionId);
                    do_settings_sections(self::MENU_SLUG);
                    submit_button();
                    ?>
                </form>
            <?php }
        );
    }

    /**
     * Warn in the admin while the staging environment is enabled.
     *
     * Staging routes donations to the test backend and never reaches the live
     * payment providers, so make the active test mode obvious on every admin page.
     */
    #[Action('admin_notices')]
    public function stagingNotice(): void
    {
        if (!$this->settings->getField('use_staging')->getValue('')) {
            return;
        }

        printf(
            '<div class="notice notice-warning"><p>%s</p></div>',
            esc_html__(
                'Lahjoitukset: the staging environment is enabled, donations are not sent to the live payment providers.',
                'fame_lahjoitukset'
            )
        );
    }

    /**
     * Resolves the backend host all clients share.
     *
     * Order of precedence:
     *   1. FAME_BACKEND_URL environment variable.
     *   2. Staging host when the "use_staging" option is enabled.
     *   3. Production host.
     */
    public function getBackendUrl(): string
    {
        if ($override = getenv('FAME_BACKEND_URL')) {
            return $override;
        }

        if ($this->settings->getField('use_staging')->getValue('')) {
            return self::STAGING_URL;
        }

        return self::PRODUCTION_URL;
    }

    /**
     * Returns the customer's organization slug.
     */
    public function getSlug(): string
    {
        return $this->settings->getField('slug')->getValue('');
    }
}
