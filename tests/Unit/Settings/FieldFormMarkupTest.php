<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit\Settings;

use Fame\WordPress\Lahjoitukset\Settings\FieldFormMarkup;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class FieldFormMarkupTest extends TestCase
{
    public function testInputTagBuildsMarkup(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);

        $this->assertSame(
            '<input type="text" name="my_field" value="hello">',
            FieldFormMarkup::inputTag('text', 'my_field', 'hello')
        );
    }

    public function testInputTagIncludesCustomAttributes(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);

        $this->assertSame(
            '<input disabled="" type="text" name="my_field" value="hello">',
            FieldFormMarkup::inputTag('text', 'my_field', 'hello', ['disabled' => ''])
        );
    }

    public function testInputTagEscapesAttributeValues(): void
    {
        WP_Mock::userFunction('esc_attr', [
            'return' => fn($value) => str_replace('"', '&quot;', (string) $value),
        ]);

        $this->assertSame(
            '<input type="text" name="my_field" value="say &quot;hi&quot;">',
            FieldFormMarkup::inputTag('text', 'my_field', 'say "hi"')
        );
    }

    public function testInputTagRejectsInvalidAttributeNames(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);

        $this->expectException(\InvalidArgumentException::class);
        FieldFormMarkup::inputTag('text', 'my_field', 'hello', ['FOO' => 'uppercase name']);
    }

    public function testDescriptionEscapesContent(): void
    {
        WP_Mock::userFunction('esc_html', [
            'return' => fn($value) => htmlspecialchars((string) $value, ENT_QUOTES),
        ]);

        $this->assertSame(
            '<p class="description">&lt;b&gt;bold&lt;/b&gt;</p>',
            FieldFormMarkup::description('<b>bold</b>')
        );
    }
}
