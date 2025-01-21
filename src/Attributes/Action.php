<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Attributes;

/**
 * Run this method in a WordPress action.
 */
#[\Attribute(\Attribute::TARGET_METHOD)]
readonly class Action
{
    /**
     * Constructs a new instance
     *
     * @param string $action
     *   Action name.
     */
    public function __construct(public string $action)
    {
    }
}
