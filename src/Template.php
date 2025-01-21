<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

/**
 * Templating engine.
 */
class Template
{

    /**
     * Include template file from templates folder.
     *
     * This does not support passing variables to templates.
     *
     * @todo Consider some simple PHP templating engine, like https://codeshack.io/lightweight-template-engine-php/.
     *
     * @param string $template
     *   Template name without file extension.
     * @param array<string,mixed> $variables
     *   Template parameters.
     *
     * @throws \InvalidArgumentException
     *   Failed to include template.
     */
    public static function includeTemplate(string $template, array $variables = []): void
    {
        if (!empty($variables)) {
            throw new \InvalidArgumentException('Template variables are not implement');
        }

        $template = LAHJOITUKSET_PLUGIN_PATH . 'templates/' . basename($template) . '.php';
        if (!file_exists($template)) {
            throw new \InvalidArgumentException("Invalid template $template");
        }

        include $template;
    }

}
