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

    public function testIncompleteDonationFormFailsSafely(): void
    {
        $markup = '<!-- wp:famehelsinki/donation-form {"type":"single"} -->'
            . '<form class="wp-block-famehelsinki-donation-form" data-type="single"></form>'
            . '<!-- /wp:famehelsinki/donation-form -->';

        $rendered = do_blocks($markup);

        $this->assertStringContainsString('configuration is incomplete', $rendered);
        $this->assertStringNotContainsString('<form', $rendered);
    }

    private function completeForm(array $attributes = [], array $extra = []): string
    {
        $children = '';
        foreach (['donation-type', 'donation-amounts', 'donation-providers', 'form-controls'] as $name) {
            $children .= '<!-- wp:famehelsinki/' . $name . ' /-->';
        }
        return '<!-- wp:famehelsinki/donation-form' . ($attributes ? ' ' . wp_json_encode($attributes) : '') . ' -->'
            . $children . implode('', $extra) . '<!-- /wp:famehelsinki/donation-form -->';
    }

    public function testCompleteFormPreservesBlockSupportStylesAndValidatedVariables(): void
    {
        $rendered = do_blocks($this->completeForm([
            'layoutVersion' => 1,
            'primaryColor' => 'rgb(30 30 30)',
            'sectionLabelColor' => 'light-dark(#fff, #000)',
            'style' => [
                'color' => ['text' => '#123456'],
                'spacing' => ['margin' => ['top' => '12px']],
                'typography' => ['fontSize' => '22px'],
            ],
        ]));
        $html = new \WP_HTML_Tag_Processor($rendered);
        self::assertTrue($html->next_tag(['class_name' => 'wp-block-famehelsinki-donation-form']));
        $style = (string) $html->get_attribute('style');
        self::assertStringContainsString('--primary-color:rgb(30 30 30)', $style);
        self::assertStringContainsString('--section-label-color:light-dark(#fff, #000)', $style);
        self::assertStringContainsString('color:#123456', $style);
        self::assertStringContainsString('margin-top:12px', $style);
        self::assertStringContainsString('font-size:22px', $style);
        self::assertStringNotContainsString('--section-label-font-weight:', $style);
        self::assertStringContainsString('fame-form--editable-layout', (string) $html->get_attribute('class'));
        self::assertStringContainsString('<form', $rendered);
    }

    public function testNestedNativeFormsFailSafelyEvenWhenTheParentHasAllSections(): void
    {
        foreach (['<!-- wp:search /-->', '<!-- wp:html --><form><input name="foreign"></form><!-- /wp:html -->'] as $nested) {
            $rendered = do_blocks($this->completeForm([], [$nested]));
            self::assertStringContainsString('contains another form', $rendered);
            self::assertStringNotContainsString('<form', $rendered);
        }
    }

    public function testNestedDonationCannotSupplyItsParentsMissingSections(): void
    {
        $markup = '<!-- wp:famehelsinki/donation-form -->'
            . $this->completeForm() . '<!-- /wp:famehelsinki/donation-form -->';
        $rendered = do_blocks($markup);
        self::assertStringContainsString('contains another form', $rendered);
        self::assertStringNotContainsString('<form', $rendered);
    }

    public function testExtraButtonsDoNotSubmitByDefault(): void
    {
        $html = \Fame\WordPress\Lahjoitukset\FormContent::prepareHtml(
            '<button>Info</button><button type="submit">Other</button>'
            . '<button type="submit">Donate</button>'
        );
        self::assertStringContainsString('<button type="button">Info', $html);
        self::assertStringContainsString('<button type="submit">Other', $html);
        self::assertStringContainsString('<button type="submit">Donate', $html);
    }

    public function testPhoneRequiredSettingOnlyAffectsVisiblePhoneField(): void
    {
        $render = static function (array $attributes): string {
            return do_blocks('<!-- wp:famehelsinki/contact-form ' . wp_json_encode($attributes) . ' /-->');
        };

        $optional = $render(['showPhone' => true]);
        $this->assertMatchesRegularExpression('/<input[^>]*name="phone"[^>]*>/', $optional);
        $this->assertDoesNotMatchRegularExpression('/<input[^>]*name="phone"[^>]*required/', $optional);

        $required = $render(['showPhone' => true, 'requirePhone' => true]);
        $this->assertMatchesRegularExpression('/<input[^>]*name="phone"[^>]*required/', $required);
        $this->assertStringContainsString('fame-form__group--required', $required);
        $this->assertStringContainsString('aria-invalid="false"', $required);
        $this->assertStringContainsString('autocomplete="tel"', $required);

        $hidden = $render(['showPhone' => false, 'requirePhone' => true]);
        $this->assertStringNotContainsString('name="phone"', $hidden);
    }

    public function testOtherAmountHelpTextIsRendered(): void
    {
		$settings = [
			[
				'type' => 'single',
				'default' => true,
				'defaultAmount' => 10,
				'minAmount' => 10,
				'maxAmount' => 10000,
				'helpText' => 'Vähintään 10€',
				'unit' => '€',
				'amounts' => [],
			]
		];

		$rendered = do_blocks('<!-- wp:famehelsinki/donation-amounts ' . wp_json_encode(['other' => true, 'settings' => $settings]) . ' /-->');

        $this->assertStringContainsString('id="single-amount-help"', $rendered);
        $this->assertStringContainsString('Vähintään 10€', $rendered);
        $this->assertStringContainsString('aria-describedby="single-amount-help"', $rendered);
    }

    public function testCampaignSelectorIsNotRenderedWithoutCampaigns(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/donation-campaigns ' . wp_json_encode(['campaigns' => []]) . ' /-->');

        $this->assertStringNotContainsString('name="campaign"', $rendered);
    }

    public function testSingleCampaignIsRenderedAsHiddenInput(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/donation-campaigns ' . wp_json_encode(['campaigns' => ['Spring']]) . ' /-->');

        $this->assertStringContainsString('<input type="hidden" name="campaign" value="Spring"', $rendered);
        $this->assertStringNotContainsString('<select', $rendered);
    }

    public function testMultipleCampaignsAreRenderedAsSelect(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/donation-campaigns ' . wp_json_encode(['campaigns' => ['Spring', 'Autumn']]) . ' /-->');

        $this->assertStringContainsString('<select name="campaign"', $rendered);
        $this->assertStringContainsString('<option value="Spring">', $rendered);
        $this->assertStringContainsString('<option value="Autumn">', $rendered);
    }

    public function testDueDateWithoutDaysIsRenderedAsHiddenInputWithDefaultDay(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/recurring-due-date ' . wp_json_encode(['days' => []]) . ' /-->');

        $this->assertStringContainsString('<input type="hidden" name="due_date" value="5"', $rendered);
        $this->assertStringContainsString('data-recurring-due-date-input', $rendered);
        $this->assertStringContainsString('disabled', $rendered);
        $this->assertStringNotContainsString('<select', $rendered);
    }

    public function testSingleDueDateDayIsRenderedAsHiddenInput(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/recurring-due-date ' . wp_json_encode(['days' => [12]]) . ' /-->');

        $this->assertStringContainsString('<input type="hidden" name="due_date" value="12"', $rendered);
        $this->assertStringNotContainsString('<select', $rendered);
    }

    public function testMultipleDueDateDaysAreRenderedAsSelect(): void
    {
        $rendered = do_blocks('<!-- wp:famehelsinki/recurring-due-date ' . wp_json_encode(['days' => [15, 1]]) . ' /-->');

        $this->assertStringContainsString('name="due_date"', $rendered);
        $this->assertStringNotContainsString('<input type="hidden" name="due_date"', $rendered);

        // Days are sorted, so the lowest day is the preselected default.
        $this->assertStringContainsString("<option value=\"1\"  selected='selected'>", $rendered);
        $this->assertStringContainsString('<option value="15" >', $rendered);
        $this->assertStringNotContainsString('<option value="2"', $rendered);
    }
}
