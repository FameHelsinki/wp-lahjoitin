<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Integration;

use Fame\WordPress\Lahjoitukset\Settings;
use WP_UnitTestCase;

final class SettingsTest extends WP_UnitTestCase
{
    public function set_up(): void
    {
        parent::set_up();

        // add_options_page() lives in the admin-only includes.
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    private function registerSettings(): Settings
    {
        $settings = new Settings();
        $settings->registerSettings();

        return $settings;
    }

    public function testSettingsAreRegistered(): void
    {
        $this->registerSettings();

        $registered = get_registered_settings();

        $this->assertArrayHasKey('slug', $registered);
        $this->assertArrayHasKey('use_staging', $registered);
    }

    public function testCheckboxValueIsNormalizedOnSave(): void
    {
        $this->registerSettings();

        // register_setting() wires the sanitize callback into update_option().
        update_option('use_staging', 'truthy-form-value');
        $this->assertSame('1', get_option('use_staging'));

        update_option('use_staging', '');
        $this->assertSame('', get_option('use_staging'));
    }

    public function testBackendUrlDefaultsToProduction(): void
    {
        $settings = $this->registerSettings();

        $this->assertSame(Settings::PRODUCTION_URL, $settings->getBackendUrl());
    }

    public function testBackendUrlUsesStagingWhenEnabled(): void
    {
        update_option('use_staging', '1');

        $settings = $this->registerSettings();

        $this->assertSame(Settings::STAGING_URL, $settings->getBackendUrl());
    }

    public function testGetSlugReturnsOptionValue(): void
    {
        update_option('slug', 'my-organization');

        $settings = $this->registerSettings();

        $this->assertSame('my-organization', $settings->getSlug());
    }

    public function testSavingSettingsClearsProvidersCache(): void
    {
        update_option('slug', 'my-organization');

        $settings = $this->registerSettings();
        $cacheKey = 'fame_lahjoitukset_providers_'
            . md5(Settings::PRODUCTION_URL . '/providers/my-organization');
        set_transient($cacheKey, ['checkout' => 'cached'], DAY_IN_SECONDS);

        // The plugin wires this to pre_update_option_slug, which options.php
        // triggers on every save of the settings form.
        add_filter('pre_update_option_slug', [$settings, 'clearProvidersCacheOnSave']);

        // Re-saving an unchanged value must still clear the cache so admins can
        // force a refresh after enabling/disabling providers in the API.
        update_option('slug', 'my-organization');

        $this->assertFalse(get_transient($cacheKey));
        $this->assertSame('my-organization', get_option('slug'));
    }
}
