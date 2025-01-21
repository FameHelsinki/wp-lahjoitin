<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

/**
 * Renders field forms.
 *
 * @todo use some sort of templating system.
 * @see \Fame\WordPress\Lahjoitukset\Template
 *
 * @internal
 */
class FieldFormMarkup
{

    /**
     * Get HTML markup for input tag.
     *
     * @param string $type
     *   Type attribute value.
     * @param string $name
     *   Name attribute value.
     * @param string $value
     *   Value attribute value.
     * @param array<string, string> $attributes
     *   Custom attributes.
     */
    public static function inputTag(string $type, string $name, string $value, array $attributes = []): string
    {
        $attributes = self::attributesMarkup(array_merge($attributes, [
            'type' => $type,
            'name' => $name,
            'value' => $value,
        ]));

        return "<input $attributes>";
    }

    /**
     * Get HTML markup for single attribute.
     *
     * @param array<string, string> $attributes
     *    Attributes.
     */
    private static function attributesMarkup(array $attributes): string
    {
        $markup = [];

        foreach ($attributes as $name => $value) {
            if (!preg_match("/[a-z-]+/", $name)) {
                throw new \InvalidArgumentException("Invalid attribute name $name");
            }

            $markup[] = $name . '="' . esc_attr($value) . '"';
        }

        return implode(' ', $markup);
    }

    /**
     * Get HTML markup for form description.
     *
     * @param string $description
     *   Field description.
     */
    public static function description(string $description): string
    {
        return '<p class="description">' . esc_html($description) . '</p>';
    }
}
