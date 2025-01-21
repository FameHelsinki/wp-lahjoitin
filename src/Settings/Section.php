<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Settings;

class Section
{
    /**
     * @var FieldInterface[]
     */
    protected array $fields = [];

    /**
     * Constructs a new instance.
     *
     * @param string $sectionId
     *   Slug-name to identify the section.
     * @param string $sectionTitle
     *   Formatted title of the section.
     */
    public function __construct(
        public readonly string $sectionId,
        public readonly string $sectionTitle,
    ) {
    }

    /**
     * Add new field to this settings object.
     *
     * @param FieldInterface $field
     *   Field to add.
     */
    public function addField(FieldInterface $field): self
    {
        $this->fields[$field->getId()] = $field;
        return $this;
    }

    /**
     * Gets field.
     */
    public function getField(string $id): ?FieldInterface
    {
        return $this->fields[$id] ?? null;
    }

    /**
     * Registers this section.
     */
    public function register(string $page): self
    {
        \add_settings_section($this->sectionId, $this->sectionTitle, [$this, 'callback'], $page);

        foreach ($this->fields as $field) {
            $field->register($this->sectionId, $page);
        }

        return $this;
    }

    /**
     * Function that echos out any content at the top of the section (between heading and fields).
     */
    public function callback(): void
    {
    }
}
