import { useEffect, useState } from 'react'
import { Provider, fetchProviders } from './Providers.ts'

/**
 * Tuple of `[available, loading, error]`:
 * - `available`: providers the organization currently has enabled.
 * - `loading`: whether the providers are still being fetched.
 * - `error`: whether the fetch failed.
 */
export type UseProviders = [Provider[], boolean, boolean]

/**
 * Resolves the payment providers enabled for the configured organization from
 * the lahjoitin API (via the plugin's own REST route), so the editor only
 * offers providers the organization has actually enabled.
 */
export function useProviders(): UseProviders {
	const [available, setAvailable] = useState<Provider[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		let active = true
		setLoading(true)
		setError(false)

		fetchProviders()
			.then(list => {
				if (active) setAvailable(list)
			})
			.catch(() => {
				if (active) setError(true)
			})
			.finally(() => {
				if (active) setLoading(false)
			})

		return () => {
			active = false
		}
	}, [])

	return [available, loading, error]
}
