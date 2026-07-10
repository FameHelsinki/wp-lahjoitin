<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Unit;

use Fame\WordPress\Lahjoitukset\Template;
use WP_Mock\Tools\TestCase;

final class TemplateTest extends TestCase
{
    public function testIncludesTemplateFromTemplatesFolder(): void
    {
        $this->expectOutputString('Hello from template');
        Template::includeTemplate('greeting');
    }

    public function testPathSegmentsAreStrippedFromTemplateName(): void
    {
        $this->expectOutputString('Hello from template');
        Template::includeTemplate('../../outside/greeting');
    }

    public function testThrowsOnUnknownTemplate(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        Template::includeTemplate('does-not-exist');
    }

    public function testThrowsOnTemplateVariables(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        Template::includeTemplate('greeting', ['name' => 'World']);
    }
}
