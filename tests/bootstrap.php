<?php

/**
 * PHPUnit bootstrap for unit tests.
 *
 * Unit tests run against WP_Mock: WordPress core functions are not loaded,
 * every WordPress function a test touches must be mocked with
 * WP_Mock::userFunction().
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

// Constants normally defined by fame-lahjoitukset.php or WordPress core.
define('LAHJOITUKSET_PLUGIN_PATH', __DIR__ . '/fixtures/plugin/');
define('LAHJOITUKSET_PLUGIN_FILE', __DIR__ . '/fixtures/plugin/fame-lahjoitukset.php');
define('LAHJOITUKSET_PLUGIN_VERSION', '0.0.0-test');
define('HOUR_IN_SECONDS', 3600);

WP_Mock::bootstrap();

// Minimal stand-ins for WordPress core classes referenced by the plugin.
// Only shape matters; behavior is controlled per test.
if (!class_exists('WP_Error')) {
    class WP_Error
    {
        public function __construct(
            public readonly string $code = '',
            public readonly string $message = '',
        ) {
        }
    }
}

if (!class_exists('WP_Filesystem_Base')) {
    class WP_Filesystem_Base
    {
        public function move(string $source, string $destination, bool $overwrite = false): bool
        {
            return false;
        }
    }
}
