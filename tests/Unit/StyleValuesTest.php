<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit;

use Fame\WordPress\Lahjoitukset\StyleValues;
use PHPUnit\Framework\TestCase;

final class StyleValuesTest extends TestCase
{
    /** @dataProvider colors */
    public function testAcceptsThemeColors(string $color): void
    {
        self::assertSame($color, StyleValues::color($color, '#000'));
    }

    public static function colors(): array
    {
        return array_map(static fn($color) => [$color], [
            '#abc', '#123456', 'transparent', 'rgb(30 30 30)', 'rgba(10, 20, 30, .5)',
            'hsl(120 30% 40%)', 'light-dark(#fff, #000)', 'oklch(60% 0.2 240)',
            'color-mix(in srgb, var(--wp--preset--color--accent) 50%, #fff)',
            'var(--wp--preset--color--accent)',
        ]);
    }

    /** @dataProvider invalidColors */
    public function testRejectsUnsafeValues(string $color): void
    {
        self::assertSame('#000', StyleValues::color($color, '#000'));
    }

    public static function invalidColors(): array
    {
        return array_map(static fn($color) => [$color], [
            '', 'url(https://example.com)', 'red;display:none', 'rgb(0 0 0);color:red',
            'expression(alert(1))', 'var(--x))', 'rgb(0 0 0) rgb(1 1 1)',
            'rgb(0/**/0/**/0)', 'var(--x, url(https://example.com))',
        ]);
    }

    public function testValidatesFontWeightWithoutOverridingThemeDefault(): void
    {
        self::assertSame('', StyleValues::fontWeight(''));
        self::assertSame('', StyleValues::fontWeight('0'));
        self::assertSame('600', StyleValues::fontWeight('600'));
        self::assertSame('1000', StyleValues::fontWeight('1000'));
        self::assertSame('', StyleValues::fontWeight('1001'));
        self::assertSame('', StyleValues::fontWeight('600;color:red'));
    }
}
