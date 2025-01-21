<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

/**
 * Base class for settings field.
 */
abstract class FieldBase implements FieldInterface
{
    private mixed $value = null;
    private bool $overridable = false;
    protected ?string $label = null;
    protected ?string $description = null;

    /**
     * Constructs a new instance.
     *
     * @param string $id
     *   Field id.
     *
     * @link https://developer.wordpress.org/reference/functions/add_settings_field/
     * @link https://developer.wordpress.org/reference/functions/register_setting/
     */
    public function __construct(
        public readonly string $id,
        public readonly mixed $default = null,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function setLabel(string $value): self
    {
        $this->label = $value;
        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function setDescription(string $value): self
    {
        $this->description = $value;
        return $this;
    }

    public function getId(): string
    {
        return $this->id;
    }

    /**
     * {@inheritDoc}
     */
    public function sanitize(mixed $value): mixed
    {
        return $value;
    }

    /**
     * {@inheritDoc}
     */
    public function register(string $section, string $page): void
    {
        if ($this->label) {
            add_settings_field($this->id, $this->label, [$this, 'callback'], $page, $section, []);
        }

        // We do not support rest option as of now.
        $options = [
            'default' => $this->default,
        ];

        if ($this->hasCallback('sanitize')) {
            $options['sanitize_callback'] = [$this, 'sanitize'];
        }

        register_setting($section, $this->id, $options);
    }

    /**
     * Checks if child class has overridden sanitize method.
     *
     * @param string $method
     *   Callback method.
     *
     * @return bool
     *   True if sanitize callback was overridden by a child class.
     */
    private function hasCallback(string $method): bool
    {
        $reflector = new \ReflectionMethod(self::class, $method);
        return $reflector->getDeclaringClass()->getName() !== static::class;
    }

    /**
     * {@inheritDoc}
     */
    public function getValue(mixed $default = false): mixed
    {
        if ($this->isOverridden()) {
            return getenv('FAME_' . strtoupper($this->id));
        }

        // Cached lookup.
        if ($this->value) {
            return $this->value;
        }

        return $this->value = get_option($this->id, $default);
    }

    /**
     * {@inheritDoc}
     */
    public function isOverridden(): bool
    {
        return $this->overridable && getenv('FAME_' . strtoupper($this->id)) !== false;
    }

    /**
     * {@inheritDoc}
     */
    public function setOverridable(bool $overridable = true): self
    {
        $this->overridable = $overridable;
        return $this;
    }
}
