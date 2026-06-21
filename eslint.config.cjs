const wordpress = require('@wordpress/eslint-plugin')
// Relaxes rules the WP preset enforces but that conflict with our Prettier setup
// (notably `curly` — the codebase uses brace-less single-line `if`s).
const prettier = require('eslint-config-prettier/flat')

// Unit test files and their helpers only.
const testFiles = ['**/@(test|__tests__)/**/*.js', '**/?(*.)test.js']

// Reuse the exact @typescript-eslint plugin instance the recommended preset
// registers, so TS-only rules below resolve under flat config.
const tsPreset = wordpress.configs.recommended.find(
	config => config.plugins && config.plugins['@typescript-eslint']
)

module.exports = [
	{
		ignores: ['build/**', 'vendor/**', 'coverage/**', '**/*.d.ts'],
	},
	...wordpress.configs.recommended,
	prettier,
	// Apply the test-unit preset only to unit-test files.
	...wordpress.configs['test-unit'].map(config => ({ ...config, files: testFiles })),
	// TS-only rule (the plugin is only available on TS files in flat config).
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: tsPreset.plugins,
		rules: {
			'@typescript-eslint/no-shadow': 'warn',
		},
	},
	{
		rules: {
			'no-console': 'warn',
			'jsdoc/require-param': 'off',
			'react/prop-types': 'off',
		},
	},
]
