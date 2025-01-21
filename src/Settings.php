<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;
use Fame\WordPress\Lahjoitukset\Settings\TextField;
use Fame\WordPress\Lahjoitukset\Settings\Section;

/**
 * Settings component.
 */
class Settings implements ComponentInterface
{
    public const string MENU_SLUG = 'lahjoitukset';
    private Section $settings;

    /**
     * Run admin_menu action.
     */
    #[Action('admin_menu')]
    public function registerSettings(): void
    {
        $this->settings = new Section('fame_lahjoitukset_settings', 'Lahjoitukset settings');
        $this->settings
            ->addField((new TextField('backend_url'))
                ->setLabel(__('Backend URL', 'fame_lahjoitukset'))
                ->setDescription(__('Your lahjoitukset-backend instance', 'fame_lahjoitukset')))
            ->register(self::MENU_SLUG);

        \add_options_page(
            __('Fame lahjoitukset settings', 'fame_lahjoitukset'),
            __('Lahjoitukset', 'fame_lahjoitukset'),
            'manage_options',
            self::MENU_SLUG,
            function () { ?>
                <?php settings_errors(); ?>
                <form method="post" action="options.php">
                    <?php settings_fields($this->settings->sectionId);
                    do_settings_sections(self::MENU_SLUG);
                    submit_button();
                    ?>
                </form>
            <?php }
        );
    }

    public function getBackendUrl(): string
    {
        return $this->settings->getField('backend_url')->getValue();
    }
}
