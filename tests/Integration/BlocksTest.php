<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Integration;

use WP_Block_Type_Registry;
use WP_UnitTestCase;

final class BlocksTest extends WP_UnitTestCase
{
    private const BLOCKS = [
        'famehelsinki/contact-form',
        'famehelsinki/donation-amounts',
        'famehelsinki/donation-campaigns',
        'famehelsinki/donation-form',
        'famehelsinki/donation-providers',
        'famehelsinki/donation-type',
		'famehelsinki/recurring-due-date',
        'famehelsinki/form-controls',
    ];

    public function testAllBlocksAreRegistered(): void
    {
        $registry = WP_Block_Type_Registry::get_instance();

        foreach (self::BLOCKS as $name) {
            $this->assertTrue($registry->is_registered($name), "Block $name is not registered.");
        }
    }

    public function testDonationFormBlockHasViewScript(): void
    {
        $block = WP_Block_Type_Registry::get_instance()->get_registered('famehelsinki/donation-form');

        $this->assertNotEmpty($block->view_script_handles);

        // The view script receives the backend configuration.
        $viewScript = reset($block->view_script_handles);
        $data = wp_scripts()->get_data($viewScript, 'data');
        $this->assertStringContainsString('backend_url', (string) $data);
    }

    public function testDonationFormMarkupSurvivesRendering(): void
    {
        $markup = '<!-- wp:famehelsinki/donation-form {"type":"single"} -->'
            . '<form class="wp-block-famehelsinki-donation-form" data-type="single"></form>'
            . '<!-- /wp:famehelsinki/donation-form -->';

        $rendered = do_blocks($markup);

        $this->assertStringContainsString('wp-block-famehelsinki-donation-form', $rendered);
    }

    public function testRecurringDueDateRendersSelectableDayByDefault(): void
    {
        $rendered = $this->renderRecurringDueDate([]);

        $this->assertStringContainsString('<select', $rendered);
        $this->assertStringNotContainsString('type="hidden"', $rendered);
        $this->assertMatchesRegularExpression(
            '/<option value="5"[^>]*selected=[\'\"]selected[\'\"]>/',
            $rendered
        );
    }

    /**
     * @dataProvider fixedDayProvider
     */
    public function testRecurringDueDateRendersClampedFixedDay(mixed $configured, int $expected): void
    {
        $rendered = $this->renderRecurringDueDate([
            'allowDonorSelection' => false,
            'defaultDay' => $configured,
        ]);

        $this->assertStringNotContainsString('<select', $rendered);
        $this->assertStringContainsString('type="hidden"', $rendered);
        $this->assertStringContainsString('name="due_date"', $rendered);
        $this->assertStringContainsString('value="' . $expected . '"', $rendered);
    }

    /** @return array<string, array{mixed, int}> */
    public function fixedDayProvider(): array
    {
        return [
            'configured day' => [14, 14],
            'below range' => [0, 1],
            'above range' => [99, 28],
            'non-numeric value' => ['invalid', 1],
        ];
    }

    public function testRecurringDueDateUsesFiveWhenFixedDayIsUnset(): void
    {
        $rendered = $this->renderRecurringDueDate(['allowDonorSelection' => false]);

        $this->assertStringContainsString('type="hidden"', $rendered);
        $this->assertStringContainsString('value="5"', $rendered);
    }

    /** @param array<string, mixed> $attributes */
    private function renderRecurringDueDate(array $attributes): string
    {
        $block = WP_Block_Type_Registry::get_instance()->get_registered(
            'famehelsinki/recurring-due-date'
        );

        $this->assertNotNull($block);

        $this->assertIsCallable($block->render_callback);

        return (string) call_user_func($block->render_callback, $attributes, '', null);
    }
}
