<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

/** Validates individual CSS values, never complete declarations. */
final class StyleValues
{
    public static function color(string $value, string $fallback): string
    {
        $color = trim($value, " \t\n\r");
        if (preg_match('/^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i', $color)
            || preg_match('/^[a-z]+$/i', $color)) {
            return $color;
        }
        // WordPress safe-CSS filtering rejects several valid colour functions.
        // Use a restricted value grammar: no declarations, escapes, strings,
        // comments, URLs or arbitrary CSS functions can enter a style value.
        if (!preg_match('/^[a-z-]+\([a-z0-9#.,%+\-\/ \t\r\n\f()]*\)$/i', $color)) {
            return $fallback;
        }
        preg_match_all('/([a-z-]+)[ \t\r\n\f]*\(/i', $color, $functions);
        $allowed = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch',
            'color', 'color-mix', 'light-dark', 'var', 'calc', 'min', 'max', 'clamp'];
        foreach ($functions[1] as $function) {
            if (!in_array(strtolower($function), $allowed, true)) {
                return $fallback;
            }
        }
        $depth = 0;
        foreach (str_split($color) as $index => $character) {
            if ($character === '(') {
                ++$depth;
            } elseif ($character === ')') {
                --$depth;
                if ($depth < 0 || ($depth === 0 && $index !== strlen($color) - 1)) {
                    return $fallback;
                }
            }
        }
        return $depth === 0 ? $color : $fallback;
    }

    public static function fontWeight(string $value): string
    {
        return preg_match('/^(?:[1-9][0-9]{0,2}|1000)$/', $value) ? $value : '';
    }
}
