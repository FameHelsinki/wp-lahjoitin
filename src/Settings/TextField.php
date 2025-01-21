<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

/**
 * Text field.
 */
class TextField extends FieldBase
{
    /**
     * {@inheritDoc}
     */
    public function callback(): void
    {
        $attributes = [];

        // Make input disabled if field value is overridden
        // with an environment variable.
        if ($this->isOverridden()) {
            $attributes['disabled'] = "";
        }

        echo FieldFormMarkup::inputTag('text', $this->id, $this->getValue(''), $attributes);
        if ($this->description) {
            echo FieldFormMarkup::description($this->description);
        }
    }
}
