import apiFetch from '@wordpress/api-fetch'

export type Provider = {
	/** Provider machine name. */
	value: string
	/** Human-readable provider name. */
	label: string
	/** Supported types. */
	types: string[]
}

/** Shape returned by the `/fame-lahjoitukset/v1/providers` REST route. */
type ApiProvider = {
	provider: string
	types: string[]
}

/**
 * Derives a default display label from a provider machine name.
 *
 * The lahjoitin API returns only machine names, so we capitalize the name to
 * seed a sensible label when a provider is first selected in the editor. Labels
 * are editable and persisted per block, so this only ever provides the initial
 * value.
 */
export function defaultLabel(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Fetches the payment providers enabled for the configured organization.
 *
 * Reads from the plugin's own REST route (same origin, no CORS) which proxies
 * the cached lahjoitin API response.
 */
export async function fetchProviders(): Promise<Provider[]> {
	const data = await apiFetch<ApiProvider[]>({
		path: '/fame-lahjoitukset/v1/providers',
	})

	return (data ?? []).map(({ provider, types }) => ({
		value: provider,
		label: defaultLabel(provider),
		types: Array.isArray(types) ? types : [],
	}))
}
