<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit\Settings;

use Fame\WordPress\Lahjoitukset\Settings\FieldInterface;
use Fame\WordPress\Lahjoitukset\Settings\Section;
use WP_Mock;
use WP_Mock\Tools\TestCase;

final class SectionTest extends TestCase
{
    public function testAddedFieldsCanBeRetrievedById(): void
    {
        $section = new Section('my_section', 'My section');

        $field = \Mockery::mock(FieldInterface::class);
        $field->shouldReceive('getId')->andReturn('my_field');

        $this->assertSame($section, $section->addField($field));
        $this->assertSame($field, $section->getField('my_field'));
        $this->assertNull($section->getField('unknown_field'));
    }

    public function testRegisterRegistersSectionAndAllFields(): void
    {
        $section = new Section('my_section', 'My section');

        $field = \Mockery::mock(FieldInterface::class);
        $field->shouldReceive('getId')->andReturn('my_field');
        $field->shouldReceive('register')->once()->with('my_section', 'my_page');
        $section->addField($field);

        WP_Mock::userFunction('add_settings_section', [
            'times' => 1,
            'args' => ['my_section', 'My section', [$section, 'callback'], 'my_page'],
        ]);

        $this->assertSame($section, $section->register('my_page'));
    }
}
