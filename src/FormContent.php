<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

/** Content policy and public HTML normalization for donation forms. */
final class FormContent
{
    /** @return list<string> */
    public static function forbiddenNames(): array
    {
        $policy = json_decode((string) file_get_contents(__DIR__ . '/form-content-policy.json'), true);
        $names = is_array($policy) ? ($policy['forbiddenBlocks'] ?? []) : [];
        return is_array($names) ? array_values(array_filter($names, 'is_string')) : [];
    }

    public static function hasForm(string $html): bool
    {
        return (new \WP_HTML_Tag_Processor($html))->next_tag(['tag_name' => 'FORM']);
    }

    public static function additionalFieldKey(mixed $value): string
    {
        if (!is_string($value)) {
            return '';
        }
        $suffix = preg_replace('/^(?:custom_)+/', '', trim($value));
        return is_string($suffix) && preg_match('/^[a-z0-9][a-z0-9_-]*$/D', $suffix) === 1
            ? 'custom_' . $suffix
            : '';
    }

    /** An ordinary extra button must not submit the donation by default. */
    public static function prepareHtml(string $html): string
    {
        $processor = new \WP_HTML_Tag_Processor($html);
        while ($processor->next_tag(['tag_name' => 'BUTTON'])) {
            if ($processor->get_attribute('type') === null || $processor->get_attribute('type') === '') {
                $processor->set_attribute('type', 'button');
            }
        }
        return $processor->get_updated_html();
    }
}
