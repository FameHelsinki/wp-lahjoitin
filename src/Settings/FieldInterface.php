<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

interface FieldInterface
{
    /**
     * Get field id.
     */
    public function getId(): string;

    /**
     * Get field value.
     */
    public function getValue(mixed $default = false): mixed;

    /**
     * Is field value currently overridden.
     */
    public function isOverridden(): bool;

    /**
     * Mark this field as overridable.
     */
    public function setOverridable(bool $overridable = true): self;

    /**
     * A callback function that sanitizes the option’s value.
     */
    public function sanitize(mixed $value): mixed;

    /**
     * Registers this field with WordPress.
     *
     * @param string $section
     *   The slug-name of the section of the settings page.
     * @param string $page
     *   The slug-name of the settings page on which to show the section.
     */
    public function register(string $section, string $page): void;

    /**
     * Set field label.
     */
    public function setLabel(string $value): self;

    /**
     * Set field description.
     */
    public function setDescription(string $value): self;

    /**
     * A callback that fills the field with the desired form inputs.
     */
    public function callback(): void;
}
