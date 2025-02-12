module.exports = {
	root: true,
	extends: [
                'plugin:@wordpress/eslint-plugin/recommended',
                'prettier',
                'plugin:react-hooks/recommended'
        ],
	overrides: [
		{
			// Unit test files and their helpers only.
			files: ['**/@(test|__tests__)/**/*.js', '**/?(*.)test.js'],
			extends: ['plugin:@wordpress/eslint-plugin/test-unit'],
		},
	],
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [require.resolve('@wordpress/babel-preset-default')],
		},
	},
	rules: {
		'@typescript-eslint/no-shadow': 'warn',
		'no-console': 'warn',
		'jsdoc/require-param': 'off',
	},
}
