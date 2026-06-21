<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;
use Fame\WordPress\Lahjoitukset\DI\ContainerInjectionInterface;
use Psr\Container\ContainerInterface;

/**
 * Exposes plugin data to the block editor over the WP REST API.
 */
class Rest implements ComponentInterface, ContainerInjectionInterface
{
    /**
     * Constructs a new instance.
     */
    public final function __construct(private Settings $settings)
    {
    }

    /**
     * {@inheritDoc}
     */
    public static function create(ContainerInterface $container): self
    {
        return new static(
            $container->get(Settings::class),
        );
    }

    /**
     * Register REST routes.
     */
    #[Action('rest_api_init')]
    public function registerRoutes(): void
    {
        register_rest_route('fame-lahjoitukset/v1', '/providers', [
            'methods'             => 'GET',
            'callback'            => [$this, 'getProviders'],
            'permission_callback' => static fn(): bool => current_user_can('edit_posts'),
        ]);
    }

    /**
     * Returns the payment providers enabled for the configured organization.
     *
     * Mirrors the lahjoitin API shape (`[{provider, types}]`) so the editor can
     * consume it directly. Returns an empty list when no providers are enabled
     * or the backend could not be reached.
     */
    public function getProviders(): \WP_REST_Response
    {
        $enabled = $this->settings->getEnabledProviders() ?? [];

        return new \WP_REST_Response(array_values($enabled));
    }
}
