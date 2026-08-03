<?php

/**
 * PHPUnit bootstrap for integration tests.
 *
 * Boots the WordPress PHPUnit test suite with this plugin loaded. Expects to
 * run inside the wp-env tests environment, which provides the test library
 * and its wp-tests-config.php at WP_TESTS_DIR.
 */

declare(strict_types=1);

$testsDir = getenv('WP_TESTS_DIR') ?: '/wordpress-phpunit';

if (!file_exists($testsDir . '/includes/functions.php')) {
    echo "WordPress test library not found in $testsDir." . PHP_EOL;
    echo 'Integration tests must run inside wp-env: npm run test:php:integration' . PHP_EOL;
    exit(1);
}

require_once $testsDir . '/includes/functions.php';

tests_add_filter('muplugins_loaded', static function (): void {
    require dirname(__DIR__, 2) . '/fame-lahjoitukset.php';
});

require $testsDir . '/includes/bootstrap.php';
