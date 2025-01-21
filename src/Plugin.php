<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

use Fame\WordPress\Lahjoitukset\Attributes\Action;
use Fame\WordPress\Lahjoitukset\DI\ContainerException;
use Fame\WordPress\Lahjoitukset\DI\ContainerInjectionInterface;
use Psr\Container\ContainerInterface;

/**
 * Wordpress plugin entrypoint.
 */
class Plugin implements ContainerInterface
{
    /**
     * @var array<string, ComponentInterface>
     */
    private array $components = [];

    /**
     * Constructs a new instance.
     */
    public function __construct()
    {
        $this->registerComponent(Settings::class);
        $this->registerComponent(Blocks::class);
    }

    /**
     * Registers a component to this plugin.
     *
     * @param string $class
     *   Component class name.
     */
    protected function registerComponent(string $class): void
    {
        try {
            $reflection = new \ReflectionClass($class);

            if (!$reflection->isSubclassOf(ComponentInterface::class)) {
                throw new \InvalidArgumentException("Class $class must implement ComponentInterface");
            }

            if ($reflection->isSubclassOf(ContainerInjectionInterface::class)) {
                $instance = $reflection->getMethod('create')->invoke(null, $this);
            } else {
                $instance = new $class();
            }
        } catch (\ReflectionException $e) {
            throw new ContainerException("Failed to instantiate $class", $e->getCode(), $e);
        }
        $this->components[$class] = $instance;

        foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
            foreach ($method->getAttributes(Action::class) as $attribute) {
                /** @var Action $action */
                $action = $attribute->newInstance();

                add_action($action->action, function () use ($instance, $method) {
                    $method->invoke($instance);
                });
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $id)
    {
        return $this->components[$id] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $id): bool
    {
        return isset($this->components[$id]);
    }
}
