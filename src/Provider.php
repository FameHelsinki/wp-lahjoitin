<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset;

/**
 * A payment provider enabled for an organization.
 */
final readonly class Provider implements \JsonSerializable
{
    /**
     * @param string[] $types
     *   Donation type slugs the provider supports.
     */
    public function __construct(
        public string $name,
        public array  $types,
    ) {
    }

    /**
     * Whether the provider supports the given donation type.
     */
    public function supportsType(string $type): bool
    {
        return in_array($type, $this->types, true);
    }

    /**
     * Builds a Provider from a decoded API entry, or null when malformed.
     *
     * @param mixed $entry
     *   A single decoded `/providers/{slug}` array entry.
		 *
		 * @throws \InvalidArgumentException
     */
    public static function fromApi(mixed $entry): self
    {
        if (!is_array($entry) || !isset($entry['provider'])) {
					throw new \InvalidArgumentException('Invalid provider provided');
        }

        $types = (isset($entry['types']) && is_array($entry['types']))
            ? array_values(array_map('strval', $entry['types']))
            : [];

        return new self((string) $entry['provider'], $types);
    }

    /**
     * @return array{provider: string, types: string[]}
     */
    public function jsonSerialize(): array
    {
        return [
            'provider' => $this->name,
            'types'    => $this->types,
        ];
    }
}
