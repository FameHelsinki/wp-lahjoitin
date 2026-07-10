<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit\Settings;

use Fame\WordPress\Lahjoitukset\Settings\CheckboxField;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class CheckboxFieldTest extends TestCase
{
    public function testSanitizeNormalizesToCheckedOrUnchecked(): void
    {
        $field = new CheckboxField('my_checkbox');

        $this->assertSame('1', $field->sanitize('1'));
        $this->assertSame('1', $field->sanitize('yes'));
        $this->assertSame('', $field->sanitize(''));
        $this->assertSame('', $field->sanitize(null));
        $this->assertSame('', $field->sanitize(false));
    }

    public function testRegisterUsesSanitizeCallback(): void
    {
        $field = new CheckboxField('my_checkbox', '');

        WP_Mock::userFunction('register_setting', [
            'times' => 1,
            'args' => [
                'section_id',
                'my_checkbox',
                \Mockery::on(fn($options) => $options['sanitize_callback'] === [$field, 'sanitize']),
            ],
        ]);

        $field->register('section_id', 'page_id');
        $this->assertConditionsMet();
    }

    public function testCallbackRendersCheckedStateFromStoredValue(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);
        WP_Mock::userFunction('get_option', ['return' => '1']);

        $field = new CheckboxField('my_checkbox');

        $this->expectOutputString('<input checked="" type="checkbox" name="my_checkbox" value="1">');
        $field->callback();
    }

    public function testCallbackRendersUncheckedStateWithDescription(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);
        WP_Mock::userFunction('esc_html', ['return_arg' => 0]);
        WP_Mock::userFunction('get_option', ['return' => '']);

        $field = new CheckboxField('my_checkbox');
        $field->setDescription('Enable the thing.');

        $this->expectOutputString(
            '<input type="checkbox" name="my_checkbox" value="1">'
            . '<p class="description">Enable the thing.</p>'
        );
        $field->callback();
    }
}
