<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit;

use Fame\WordPress\Lahjoitukset\Blocks;
use Fame\WordPress\Lahjoitukset\Settings;
use WP_Mock;
use WP_Mock\Tools\TestCase;

/**
 * Locale fallback behavior. The fixture languages directory
 * (tests/fixtures/plugin/languages) ships only the full fi_FI locale.
 */
final class BlocksTest extends TestCase
{
    private const DOMAIN = 'fame_lahjoitukset';
    private const LANG_DIR = LAHJOITUKSET_PLUGIN_PATH . 'languages';

    private function createBlocks(): Blocks
    {
        return new Blocks(\Mockery::mock(Settings::class));
    }

    public function testLoadTextdomainUsesExactLocale(): void
    {
        WP_Mock::userFunction('determine_locale', ['return' => 'fi_FI']);
        WP_Mock::userFunction('load_textdomain', [
            'times' => 1,
            'args' => [self::DOMAIN, self::LANG_DIR . '/fame_lahjoitukset-fi_FI.mo', 'fi_FI'],
            'return' => true,
        ]);

        $this->createBlocks()->loadTextdomain();
        $this->assertConditionsMet();
    }

    public function testLoadTextdomainFallsBackFromShortToFullLocale(): void
    {
        WP_Mock::userFunction('determine_locale', ['return' => 'fi']);
        WP_Mock::userFunction('load_textdomain', [
            'times' => 1,
            'args' => [self::DOMAIN, self::LANG_DIR . '/fame_lahjoitukset-fi.mo', 'fi'],
            'return' => false,
        ]);
        WP_Mock::userFunction('load_textdomain', [
            'times' => 1,
            'args' => [self::DOMAIN, self::LANG_DIR . '/fame_lahjoitukset-fi_FI.mo', 'fi_FI'],
            'return' => true,
        ]);

        $this->createBlocks()->loadTextdomain();
        $this->assertConditionsMet();
    }

    public function testLoadTextdomainStopsWhenNoFallbackExists(): void
    {
        WP_Mock::userFunction('determine_locale', ['return' => 'de']);
        // Short locale with no de_*.mo shipped: only the exact locale is tried.
        WP_Mock::userFunction('load_textdomain', [
            'times' => 1,
            'args' => [self::DOMAIN, self::LANG_DIR . '/fame_lahjoitukset-de.mo', 'de'],
            'return' => false,
        ]);

        $this->createBlocks()->loadTextdomain();
        $this->assertConditionsMet();
    }

    public function testScriptTranslationFileIgnoresOtherDomains(): void
    {
        $file = '/site/languages/other-fi-abc123.json';

        $this->assertSame(
            $file,
            $this->createBlocks()->filterScriptTranslationFile($file, 'handle', 'other')
        );
    }

    public function testScriptTranslationFileIgnoresUnresolvedFile(): void
    {
        $this->assertFalse(
            $this->createBlocks()->filterScriptTranslationFile(false, 'handle', self::DOMAIN)
        );
    }

    public function testScriptTranslationFileKeepsReadableFile(): void
    {
        $file = self::LANG_DIR . '/fame_lahjoitukset-fi_FI-abc123.json';

        $this->assertSame(
            $file,
            $this->createBlocks()->filterScriptTranslationFile($file, 'handle', self::DOMAIN)
        );
    }

    public function testScriptTranslationFileFallsBackToFullLocale(): void
    {
        WP_Mock::userFunction('determine_locale', ['return' => 'fi']);

        // WordPress resolved the short-locale file, which is not shipped.
        $missing = self::LANG_DIR . '/fame_lahjoitukset-fi-abc123.json';

        $this->assertSame(
            self::LANG_DIR . '/fame_lahjoitukset-fi_FI-abc123.json',
            $this->createBlocks()->filterScriptTranslationFile($missing, 'handle', self::DOMAIN)
        );
    }

    public function testScriptTranslationFileKeepsMissingFileWithoutFallback(): void
    {
        WP_Mock::userFunction('determine_locale', ['return' => 'de']);

        $missing = self::LANG_DIR . '/fame_lahjoitukset-de-abc123.json';

        $this->assertSame(
            $missing,
            $this->createBlocks()->filterScriptTranslationFile($missing, 'handle', self::DOMAIN)
        );
    }
}
