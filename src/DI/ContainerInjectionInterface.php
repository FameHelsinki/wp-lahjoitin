<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\DI;

use Psr\Container\ContainerInterface;

/**
 * Defines a common interface for dependency container injection.
 *
 * This interface gives classes who need services a factory method for
 * instantiation rather than defining a new service.
 */
interface ContainerInjectionInterface
{
    /**
     * Instantiates a new instance of this class.
     *
     * @param ContainerInterface $container
     *   The service container this instance should use.
     */
    public static function create(ContainerInterface $container): self;
}
