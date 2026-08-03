import { request, type FullConfig } from '@playwright/test'
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright'

/**
 * Log in as admin once and persist the authenticated state for all tests.
 */
export default async function globalSetup(config: FullConfig) {
	const { storageState, baseURL } = config.projects[0].use
	const storageStatePath = typeof storageState === 'string' ? storageState : undefined

	const requestContext = await request.newContext({ baseURL })
	const requestUtils = new RequestUtils(requestContext, { storageStatePath })

	await requestUtils.setupRest()
	await requestUtils.activateTheme('twentytwentyfive')
	await requestUtils.activatePlugin('lahjoitin')
	await requestContext.dispose()
}
