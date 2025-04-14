<?php

declare(strict_types=1);

use Fame\WordPress\Lahjoitukset\Plugin;

/**
 * Plugin Name:       Lahjoitin
 * Description:       Wordpress plugin for Fame lahjoitukset system.
 * Version:           1.x
 * Requires at least: 6.7
 * Requires PHP:      8.3
 * Author:            Fame Helsinki
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       fame_lahjoitukset
 *
 * @package CreateBlock
 */

defined('ABSPATH') || exit; // Exit if accessed directly.

define('LAHJOITUKSET_PLUGIN_PATH', plugin_dir_path(__FILE__));    // define the absolute plugin path for includes

// Require Composer autoloader.
if (!file_exists(LAHJOITUKSET_PLUGIN_PATH . 'vendor/autoload.php')) {
    add_action('admin_notices', static function () {
        include LAHJOITUKSET_PLUGIN_PATH . 'templates/error-reinstall.php';
    });

    return;
}

require_once LAHJOITUKSET_PLUGIN_PATH . 'vendor/autoload.php';

new Plugin();
