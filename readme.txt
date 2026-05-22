=== Lahjoitin ===
Contributors:      Fame Helsinki
Tags:              block, donation
Tested up to:      6.7
Stable tag:        1.1.3
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

WordPress plugin for the Lahjoitin.fi donation platform.

== Description ==

Lahjoitin is a WordPress plugin that provides a Gutenberg block for adding a donation form to your website.  
It is part of the Lahjoitin.fi donation platform developed by Fame and integrates into WordPress to support easy and accessible online donations.

The plugin provides configurable blocks for donation type selection, donation amounts, campaign selection, contact details and payment providers.

Learn more at https://lahjoitin.fi

== Installation ==

1. Upload the plugin files to the /wp-content/plugins/wp-lahjoitin directory, or install the plugin through the WordPress Plugins screen.
2. Activate the plugin through the Plugins screen in WordPress.
3. Add the Lahjoitin block to a page using the block editor.
4. Configure donation options and publish the page.

== Development ==

Install dependencies:

npm install

Build the block scripts:

npm run build

Start development build with watch mode:

npm run dev

== Translations ==

The plugin supports translations using WordPress internationalization (i18n).  
All source strings are written in English and use the text domain: fame_lahjoitukset.

Translation files are located in the /languages directory.

Currently supported languages include:
- Finnish (fi_FI)
- Swedish (sv_SE)

The repository includes compiled .mo files for PHP and .json files for JavaScript so translations work immediately when the plugin is installed.

== Updating translation strings ==

If source strings in the code change, regenerate the translation template from the plugin directory:

npm run i18n:pot

This updates the translation template:

languages/fame_lahjoitukset.pot

== Updating translations ==

After updating the POT file, update the translation files:

languages/fame_lahjoitukset-fi_FI.po  
languages/fame_lahjoitukset-sv_SE.po

Add or update translations for any new or changed strings.

== Regenerating translation build files ==

After updating the .po files run:

npm run i18n

This generates:
- .mo files used by PHP
- .json files used by the block editor and frontend JavaScript

These files are committed to the repository so the plugin works without running build tools after installation.

== Frequently Asked Questions ==

= Where do I get support? =

Contact Fame Helsinki at info@fame.fi.

== Changelog ==

= 1.1.3 =
* Translation workflow improvements
* Updated translation files

= 1.0.0 =
* Initial release