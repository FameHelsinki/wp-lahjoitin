<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit\Settings;

use Fame\WordPress\Lahjoitukset\Settings\TextField;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class TextFieldTest extends TestCase
{
    public function tearDown(): void
    {
        putenv('FAME_MY_TEXT');
        parent::tearDown();
    }

    public function testCallbackRendersStoredValue(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);
        WP_Mock::userFunction('get_option', ['return' => 'stored-value']);

        $field = new TextField('my_text');

        $this->expectOutputString('<input type="text" name="my_text" value="stored-value">');
        $field->callback();
    }

    public function testCallbackRendersDescription(): void
    {
        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);
        WP_Mock::userFunction('esc_html', ['return_arg' => 0]);
        WP_Mock::userFunction('get_option', ['return' => '']);

        $field = new TextField('my_text');
        $field->setDescription('Organization slug.');

        $this->expectOutputString(
            '<input type="text" name="my_text" value="">'
            . '<p class="description">Organization slug.</p>'
        );
        $field->callback();
    }

    public function testCallbackDisablesInputWhenOverriddenByEnvironment(): void
    {
        putenv('FAME_MY_TEXT=from-env');

        WP_Mock::userFunction('esc_attr', ['return_arg' => 0]);
        WP_Mock::userFunction('get_option', ['times' => 0]);

        $field = (new TextField('my_text'))->setOverridable();

        $this->expectOutputString('<input disabled="" type="text" name="my_text" value="from-env">');
        $field->callback();
    }
}
