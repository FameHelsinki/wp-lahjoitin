<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit\Settings;

use Fame\WordPress\Lahjoitukset\Settings\FieldBase;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class FieldBaseTest extends TestCase
{
    public function tearDown(): void
    {
        // Clear environment overrides so tests stay independent.
        putenv('FAME_TEST_FIELD');
        parent::tearDown();
    }

    private function createField(string $id = 'test_field', mixed $default = null): FieldBase
    {
        return new class ($id, $default) extends FieldBase {
            public function callback(): void
            {
            }
        };
    }

    public function testSanitizeReturnsValueUnchanged(): void
    {
        $field = $this->createField();

        $this->assertSame('raw <value>', $field->sanitize('raw <value>'));
        $this->assertNull($field->sanitize(null));
    }

    public function testSettersAreFluent(): void
    {
        $field = $this->createField();

        $this->assertSame($field, $field->setLabel('Label'));
        $this->assertSame($field, $field->setDescription('Description'));
        $this->assertSame($field, $field->setOverridable());
    }

    public function testGetValueReadsOptionAndCachesResult(): void
    {
        $field = $this->createField();

        WP_Mock::userFunction('get_option', [
            'times' => 1,
            'args' => ['test_field', false],
            'return' => 'stored-value',
        ]);

        $this->assertSame('stored-value', $field->getValue());
        // Second call must be served from the cache, not get_option.
        $this->assertSame('stored-value', $field->getValue());
    }

    public function testGetValuePassesDefaultToGetOption(): void
    {
        $field = $this->createField();

        WP_Mock::userFunction('get_option', [
            'times' => 1,
            'args' => ['test_field', 'fallback'],
            'return' => 'fallback',
        ]);

        $this->assertSame('fallback', $field->getValue('fallback'));
    }

    public function testIsOverriddenRequiresOverridableFlag(): void
    {
        putenv('FAME_TEST_FIELD=from-env');

        $this->assertFalse($this->createField()->isOverridden());
        $this->assertTrue($this->createField()->setOverridable()->isOverridden());
    }

    public function testGetValuePrefersEnvironmentOverride(): void
    {
        putenv('FAME_TEST_FIELD=from-env');

        $field = $this->createField()->setOverridable();

        // get_option must not be consulted at all.
        WP_Mock::userFunction('get_option', ['times' => 0]);

        $this->assertSame('from-env', $field->getValue());
    }

    public function testRegisterWithoutLabelOnlyRegistersSetting(): void
    {
        $field = $this->createField(default: 'default-value');

        WP_Mock::userFunction('add_settings_field', ['times' => 0]);
        WP_Mock::userFunction('register_setting', [
            'times' => 1,
            'args' => [
                'section_id',
                'test_field',
                \Mockery::on(fn($options) => $options['default'] === 'default-value'),
            ],
        ]);

        $field->register('section_id', 'page_id');
        $this->assertConditionsMet();
    }

    public function testRegisterWithLabelAddsSettingsField(): void
    {
        $field = $this->createField()->setLabel('My label');

        WP_Mock::userFunction('add_settings_field', [
            'times' => 1,
            'args' => ['test_field', 'My label', [$field, 'callback'], 'page_id', 'section_id', []],
        ]);
        WP_Mock::userFunction('register_setting', ['times' => 1]);

        $field->register('section_id', 'page_id');
        $this->assertConditionsMet();
    }
}
