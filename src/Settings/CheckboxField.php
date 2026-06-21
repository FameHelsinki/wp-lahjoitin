<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

/**
 * Checkbox field.
 */
class CheckboxField extends FieldBase
{
    /**
     * {@inheritDoc}
     */
    public function callback(): void
    {
        $attributes = [];

        // Reflect the stored value as the checked state.
        if ($this->getValue('')) {
            $attributes['checked'] = '';
        }

        // Make input disabled if field value is overridden
        // with an environment variable.
        if ($this->isOverridden()) {
            $attributes['disabled'] = '';
        }

        echo FieldFormMarkup::inputTag('checkbox', $this->id, '1', $attributes);
        if ($this->description) {
            echo FieldFormMarkup::description($this->description);
        }
    }

    /**
     * {@inheritDoc}
     *
     * Unchecked checkboxes are omitted from the POST data, so normalize any
     * submitted value to '1' and let the registered default ('') represent
     * the unchecked state.
     */
    public function sanitize(mixed $value): mixed
    {
        return $value ? '1' : '';
    }
}
