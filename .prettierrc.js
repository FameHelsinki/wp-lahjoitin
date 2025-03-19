const config = require('@wordpress/prettier-config')

module.exports = {
	...config,
	semi: false,
	printWidth: 100,
	arrowParens: 'avoid',
}
