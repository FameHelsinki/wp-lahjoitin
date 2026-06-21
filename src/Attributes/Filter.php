<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Attributes;

/**
 * Run this method in a WordPress filter.
 */
#[\Attribute(\Attribute::TARGET_METHOD | \Attribute::IS_REPEATABLE)]
readonly class Filter
{
    /**
     * Constructs a new instance
     *
     * @param string $filter
     *   Filter name.
     * @param int $priority
     *   Hook priority.
     * @param int $acceptedArgs
     *   Number of arguments passed to the method.
     */
    public function __construct(
        public string $filter,
        public int $priority = 10,
        public int $acceptedArgs = 1,
    ) {
    }
}
