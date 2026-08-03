<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit;

use Fame\WordPress\Lahjoitukset\Updater;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class UpdaterTest extends TestCase
{
    private const PLUGIN_FILE = 'fame-lahjoitukset/fame-lahjoitukset.php';
    private const PLUGIN_SLUG = 'fame-lahjoitukset';

    public function tearDown(): void
    {
        unset($GLOBALS['wp_filesystem']);
        parent::tearDown();
    }

    private function createUpdater(string $currentVersion = '1.0.0'): Updater
    {
        return new Updater(
            'https://example.com/update.json',
            self::PLUGIN_FILE,
            self::PLUGIN_SLUG,
            $currentVersion,
        );
    }

    /**
     * Serve update metadata from the cache transient.
     *
     * @param array<string, mixed> $metadata
     */
    private function mockCachedMetadata(array $metadata): void
    {
        WP_Mock::userFunction('is_admin', ['return' => false]);
        WP_Mock::userFunction('get_site_transient', [
            'args' => ['fame_lahjoitukset_update_metadata'],
            'return' => $metadata,
        ]);
    }

    public function testNewerVersionIsOfferedAsUpdate(): void
    {
        $this->mockCachedMetadata([
            'version' => '2.0.0',
            'download_url' => 'https://example.com/plugin-2.0.0.zip',
        ]);

        $transient = $this->createUpdater('1.0.0')->filterUpdateTransient(new \stdClass());

        $this->assertArrayHasKey(self::PLUGIN_FILE, $transient->response);
        $this->assertArrayNotHasKey(self::PLUGIN_FILE, $transient->no_update);

        $entry = $transient->response[self::PLUGIN_FILE];
        $this->assertSame('2.0.0', $entry->new_version);
        $this->assertSame('https://example.com/plugin-2.0.0.zip', $entry->package);
        $this->assertSame(self::PLUGIN_SLUG, $entry->slug);
    }

    public function testOlderVersionIsReportedAsNoUpdate(): void
    {
        $this->mockCachedMetadata([
            'version' => '0.9.0',
            'download_url' => 'https://example.com/plugin-0.9.0.zip',
        ]);

        $transient = $this->createUpdater('1.0.0')->filterUpdateTransient(new \stdClass());

        $this->assertArrayNotHasKey(self::PLUGIN_FILE, $transient->response);
        $this->assertArrayHasKey(self::PLUGIN_FILE, $transient->no_update);
    }

    public function testNonObjectTransientIsNormalized(): void
    {
        $this->mockCachedMetadata([
            'version' => '2.0.0',
            'download_url' => 'https://example.com/plugin-2.0.0.zip',
        ]);

        $transient = $this->createUpdater('1.0.0')->filterUpdateTransient(false);

        $this->assertIsObject($transient);
        $this->assertArrayHasKey(self::PLUGIN_FILE, $transient->response);
    }

    public function testFailedMetadataFetchIsCachedNegativelyAndLeavesTransientUntouched(): void
    {
        WP_Mock::userFunction('is_admin', ['return' => false]);
        WP_Mock::userFunction('get_site_transient', ['return' => false]);
        WP_Mock::userFunction('wp_remote_get', ['return' => ['response' => ['code' => 500]]]);
        WP_Mock::userFunction('is_wp_error', ['return' => false]);
        WP_Mock::userFunction('wp_remote_retrieve_response_code', ['return' => 500]);
        WP_Mock::userFunction('set_site_transient', [
            'times' => 1,
            'args' => ['fame_lahjoitukset_update_metadata_miss', 1, HOUR_IN_SECONDS],
        ]);

        $transient = $this->createUpdater()->filterUpdateTransient(new \stdClass());

        $this->assertSame([], $transient->response);
        $this->assertSame([], $transient->no_update);
    }

    public function testSuccessfulFetchCachesMetadata(): void
    {
        $body = json_encode([
            'version' => '2.0.0',
            'download_url' => 'https://example.com/plugin-2.0.0.zip',
        ]);

        WP_Mock::userFunction('is_admin', ['return' => false]);
        WP_Mock::userFunction('get_site_transient', ['return' => false]);
        WP_Mock::userFunction('wp_remote_get', ['return' => ['body' => $body]]);
        WP_Mock::userFunction('is_wp_error', ['return' => false]);
        WP_Mock::userFunction('wp_remote_retrieve_response_code', ['return' => 200]);
        WP_Mock::userFunction('wp_remote_retrieve_body', ['return' => $body]);
        WP_Mock::userFunction('set_site_transient', [
            'times' => 1,
            'args' => ['fame_lahjoitukset_update_metadata', \Mockery::type('array'), 12 * HOUR_IN_SECONDS],
        ]);
        WP_Mock::userFunction('delete_site_transient', [
            'times' => 1,
            'args' => ['fame_lahjoitukset_update_metadata_miss'],
        ]);

        $transient = $this->createUpdater('1.0.0')->filterUpdateTransient(new \stdClass());

        $this->assertArrayHasKey(self::PLUGIN_FILE, $transient->response);
    }

    public function testPluginsApiIgnoresOtherActionsAndSlugs(): void
    {
        $updater = $this->createUpdater();

        $this->assertFalse($updater->filterPluginsApi(false, 'query_plugins', (object) ['slug' => self::PLUGIN_SLUG]));
        $this->assertFalse($updater->filterPluginsApi(false, 'plugin_information', (object) ['slug' => 'other-plugin']));
    }

    public function testPluginsApiReturnsPluginInformation(): void
    {
        $this->mockCachedMetadata([
            'name' => 'Lahjoitin',
            'version' => '2.0.0',
            'download_url' => 'https://example.com/plugin-2.0.0.zip',
            'sections' => ['changelog' => '<p>Changes</p>'],
        ]);

        $result = $this->createUpdater()->filterPluginsApi(
            false,
            'plugin_information',
            (object) ['slug' => self::PLUGIN_SLUG],
        );

        $this->assertIsObject($result);
        $this->assertSame('Lahjoitin', $result->name);
        $this->assertSame('2.0.0', $result->version);
        $this->assertSame(['changelog' => '<p>Changes</p>'], $result->sections);
    }

    private function mockSlashFunctions(): void
    {
        WP_Mock::userFunction('untrailingslashit', ['return' => fn($value) => rtrim((string) $value, '/')]);
        WP_Mock::userFunction('trailingslashit', ['return' => fn($value) => rtrim((string) $value, '/') . '/']);
    }

    /**
     * Test double recording filesystem moves.
     */
    private function createFilesystem(bool $moveResult): \WP_Filesystem_Base
    {
        return new class ($moveResult) extends \WP_Filesystem_Base {
            /** @var array<array{string, string, bool}> */
            public array $moves = [];

            public function __construct(private bool $moveResult)
            {
            }

            public function move(string $source, string $destination, bool $overwrite = false): bool
            {
                $this->moves[] = [$source, $destination, $overwrite];
                return $this->moveResult;
            }
        };
    }

    public function testSourceSelectionIgnoresNonStringPaths(): void
    {
        $updater = $this->createUpdater();

        $this->assertFalse(
            $updater->filterSourceSelection(false, '/tmp/upgrade', null, ['plugin' => self::PLUGIN_FILE])
        );
    }

    public function testSourceSelectionIgnoresOtherPlugins(): void
    {
        $updater = $this->createUpdater();

        $this->assertSame(
            '/tmp/upgrade/pkg/',
            $updater->filterSourceSelection('/tmp/upgrade/pkg/', '/tmp/upgrade', null, ['plugin' => 'other/other.php'])
        );
    }

    public function testSourceSelectionKeepsFolderAlreadyMatchingSlug(): void
    {
        $this->mockSlashFunctions();

        $result = $this->createUpdater()->filterSourceSelection(
            '/tmp/upgrade/fame-lahjoitukset/',
            '/tmp/upgrade',
            null,
            ['plugin' => self::PLUGIN_FILE],
        );

        $this->assertSame('/tmp/upgrade/fame-lahjoitukset/', $result);
    }

    public function testSourceSelectionFallsBackWithoutFilesystem(): void
    {
        $this->mockSlashFunctions();

        $result = $this->createUpdater()->filterSourceSelection(
            '/tmp/upgrade/pkg-1.2.3/',
            '/tmp/upgrade',
            null,
            ['plugin' => self::PLUGIN_FILE],
        );

        $this->assertSame('/tmp/upgrade/pkg-1.2.3/', $result);
    }

    public function testSourceSelectionRenamesMismatchedFolder(): void
    {
        $this->mockSlashFunctions();
        $GLOBALS['wp_filesystem'] = $filesystem = $this->createFilesystem(true);

        $result = $this->createUpdater()->filterSourceSelection(
            '/tmp/upgrade/pkg-1.2.3/',
            '/tmp/upgrade',
            null,
            ['plugin' => self::PLUGIN_FILE],
        );

        $this->assertSame('/tmp/upgrade/fame-lahjoitukset/', $result);
        $this->assertSame(
            [['/tmp/upgrade/pkg-1.2.3', '/tmp/upgrade/fame-lahjoitukset', true]],
            $filesystem->moves,
        );
    }

    public function testSourceSelectionReturnsErrorWhenRenameFails(): void
    {
        $this->mockSlashFunctions();
        WP_Mock::userFunction('__', ['return_arg' => 0]);
        $GLOBALS['wp_filesystem'] = $this->createFilesystem(false);

        $result = $this->createUpdater()->filterSourceSelection(
            '/tmp/upgrade/pkg-1.2.3/',
            '/tmp/upgrade',
            null,
            ['plugin' => self::PLUGIN_FILE],
        );

        $this->assertInstanceOf(\WP_Error::class, $result);
    }
}
