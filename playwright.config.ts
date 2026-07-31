import { defineConfig, devices } from '@playwright/test'

/**
 * E2e tests run against the wp-env tests site. Start it first:
 * npm run env:start
 */
process.env.WP_BASE_URL ??= 'http://localhost:8889'
process.env.STORAGE_STATE_PATH ??= 'tests/e2e/artifacts/storage-state.json'

export default defineConfig({
	testDir: './tests/e2e',
	outputDir: './tests/e2e/artifacts/test-results',
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
	globalSetup: './tests/e2e/global-setup.ts',
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI
		? [['github'], ['html', { outputFolder: 'tests/e2e/artifacts/report', open: 'never' }]]
		: 'list',
	use: {
		...devices['Desktop Chrome'],
		baseURL: process.env.WP_BASE_URL,
		storageState: process.env.STORAGE_STATE_PATH,
		trace: 'retain-on-failure',
	},
})
