<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\DI\ContainerInjectionInterface;
use Psr\Container\ContainerInterface;

/**
 * Auto-update component.
 *
 * Pulls update metadata from a static JSON document (published to GitHub Pages
 * by the build workflow) and feeds it into WordPress' built-in plugin updater
 * so sites running this plugin can be updated through wp-admin like any
 * WordPress.org plugin.
 */
class Updater implements ComponentInterface, ContainerInjectionInterface
{
    public const string METADATA_URL = 'https://famehelsinki.github.io/wp-lahjoitin/update.json';
    private const string TRANSIENT_KEY = 'fame_lahjoitukset_update_metadata';
    private const string NEGATIVE_TRANSIENT_KEY = 'fame_lahjoitukset_update_metadata_miss';

    /**
     * @param string $metadataUrl    Full URL to the update.json metadata document.
     * @param string $pluginFile     Plugin basename, e.g. "fame-lahjoitukset/fame-lahjoitukset.php".
     * @param string $pluginSlug     Plugin slug (dirname of $pluginFile).
     * @param string $currentVersion Currently installed plugin version.
     */
    final public function __construct(
        private string $metadataUrl,
        private string $pluginFile,
        private string $pluginSlug,
        private string $currentVersion,
    ) {
        add_filter('pre_set_site_transient_update_plugins', [$this, 'filterUpdateTransient']);
        add_filter('plugins_api', [$this, 'filterPluginsApi'], 10, 3);
        add_filter('upgrader_source_selection', [$this, 'filterSourceSelection'], 10, 4);
    }

    /**
     * {@inheritDoc}
     */
    public static function create(ContainerInterface $container): self
    {
        $pluginFile = plugin_basename(LAHJOITUKSET_PLUGIN_FILE);

        return new static(
            self::METADATA_URL,
            $pluginFile,
            dirname($pluginFile),
            LAHJOITUKSET_PLUGIN_VERSION,
        );
    }

    /**
     * Inject update info into the site_transient_update_plugins payload.
     *
     * @param mixed $transient Whatever WordPress is about to store. Usually a
     *   stdClass with `checked`, `response`, and `no_update` arrays; sometimes
     *   null or false on the very first check.
     * @return mixed
     */
    public function filterUpdateTransient($transient)
    {
        if (!is_object($transient)) {
            $transient = new \stdClass();
        }
        if (!isset($transient->response) || !is_array($transient->response)) {
            $transient->response = [];
        }
        if (!isset($transient->no_update) || !is_array($transient->no_update)) {
            $transient->no_update = [];
        }

        $metadata = $this->fetchMetadata($this->shouldForceRefresh());
        if ($metadata === null) {
            return $transient;
        }

        $entry = $this->buildTransientEntry($metadata);

        if (version_compare((string) $metadata['version'], $this->currentVersion, '>')) {
            $transient->response[$this->pluginFile] = $entry;
            unset($transient->no_update[$this->pluginFile]);
        } else {
            $transient->no_update[$this->pluginFile] = $entry;
            unset($transient->response[$this->pluginFile]);
        }

        return $transient;
    }

    /**
     * Provide plugin information for the "View details" modal.
     *
     * @param mixed  $result Either false, an object, or a WP_Error from earlier filters.
     * @param string $action The plugins_api action being performed.
     * @param mixed  $args   Object with at least a `slug` property.
     * @return mixed
     */
    public function filterPluginsApi($result, string $action, $args)
    {
        if ($action !== 'plugin_information') {
            return $result;
        }
        if (!is_object($args) || !isset($args->slug) || $args->slug !== $this->pluginSlug) {
            return $result;
        }

        $metadata = $this->fetchMetadata();
        if ($metadata === null) {
            return $result;
        }

        return $this->buildPluginsApiResponse($metadata);
    }

    /**
     * Rename the extracted source directory so WordPress installs into the
     * expected plugin folder even when the release zip's top-level folder name
     * does not match the plugin slug.
     *
     * @param mixed                                  $source       Path to the extracted plugin source.
     * @param mixed                                  $remoteSource Path to the temp directory containing $source.
     * @param \WP_Upgrader                           $upgrader     The upgrader instance (unused).
     * @param array<string, mixed>                   $hookExtra    Extra args, including the plugin basename.
     * @return string|\WP_Error
     */
    public function filterSourceSelection($source, $remoteSource, $upgrader, $hookExtra)
    {
        if (!is_string($source) || !is_string($remoteSource)) {
            return $source;
        }
        if (!isset($hookExtra['plugin']) || $hookExtra['plugin'] !== $this->pluginFile) {
            return $source;
        }

        $source = untrailingslashit($source);

        if (basename($source) === $this->pluginSlug) {
            return trailingslashit($source);
        }

        global $wp_filesystem;
        if (!($wp_filesystem instanceof \WP_Filesystem_Base)) {
            return trailingslashit($source);
        }

        $expected = trailingslashit($remoteSource) . $this->pluginSlug;

        if (!$wp_filesystem->move($source, $expected, true)) {
            return new \WP_Error(
                'fame_lahjoitukset_source_rename_failed',
                __('Could not rename the extracted plugin folder.', 'fame_lahjoitukset')
            );
        }

        return trailingslashit($expected);
    }

    private function shouldForceRefresh(): bool
    {
        if (!is_admin() || !function_exists('current_user_can') || !current_user_can('update_plugins')) {
            return false;
        }
        return isset($_GET['force-check']);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchMetadata(bool $forceRefresh = false): ?array
    {
        if (!$forceRefresh) {
            $cached = get_site_transient(self::TRANSIENT_KEY);
            if (is_array($cached)) {
                return $cached;
            }
            if (get_site_transient(self::NEGATIVE_TRANSIENT_KEY) !== false) {
                return null;
            }
        }

        $response = wp_remote_get($this->metadataUrl, [
            'timeout' => 10,
            'headers' => ['Accept' => 'application/json'],
        ]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            $this->cacheNegative();
            return null;
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($decoded) || empty($decoded['version']) || empty($decoded['download_url'])) {
            $this->cacheNegative();
            return null;
        }

        set_site_transient(self::TRANSIENT_KEY, $decoded, 12 * HOUR_IN_SECONDS);
        delete_site_transient(self::NEGATIVE_TRANSIENT_KEY);

        return $decoded;
    }

    private function cacheNegative(): void
    {
        set_site_transient(self::NEGATIVE_TRANSIENT_KEY, 1, HOUR_IN_SECONDS);
    }

    /**
     * @param array<string, mixed> $metadata
     */
    private function buildTransientEntry(array $metadata): \stdClass
    {
        $entry = new \stdClass();
        $entry->slug = $this->pluginSlug;
        $entry->plugin = $this->pluginFile;
        $entry->new_version = (string) $metadata['version'];
        $entry->url = (string) ($metadata['homepage'] ?? '');
        $entry->package = (string) $metadata['download_url'];
        $entry->tested = (string) ($metadata['tested'] ?? '');
        $entry->requires = (string) ($metadata['requires'] ?? '');
        $entry->requires_php = (string) ($metadata['requires_php'] ?? '');
        $entry->icons = isset($metadata['icons']) && is_array($metadata['icons']) ? $metadata['icons'] : [];
        $entry->banners = isset($metadata['banners']) && is_array($metadata['banners']) ? $metadata['banners'] : [];

        return $entry;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    private function buildPluginsApiResponse(array $metadata): \stdClass
    {
        $info = new \stdClass();
        $info->name = (string) ($metadata['name'] ?? 'Lahjoitin');
        $info->slug = $this->pluginSlug;
        $info->version = (string) $metadata['version'];
        $info->author = (string) ($metadata['author'] ?? '');
        $info->homepage = (string) ($metadata['homepage'] ?? '');
        $info->download_link = (string) $metadata['download_url'];
        $info->requires = (string) ($metadata['requires'] ?? '');
        $info->tested = (string) ($metadata['tested'] ?? '');
        $info->requires_php = (string) ($metadata['requires_php'] ?? '');
        $info->last_updated = (string) ($metadata['last_updated'] ?? '');
        $info->sections = isset($metadata['sections']) && is_array($metadata['sections']) ? $metadata['sections'] : [];
        $info->icons = isset($metadata['icons']) && is_array($metadata['icons']) ? $metadata['icons'] : [];
        $info->banners = isset($metadata['banners']) && is_array($metadata['banners']) ? $metadata['banners'] : [];

        return $info;
    }
}
