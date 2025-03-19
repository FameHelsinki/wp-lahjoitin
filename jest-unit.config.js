const config = require('@wordpress/scripts/config/jest-unit.config')

config.moduleNameMapper = {
	'^@wordpress/block-editor$': '<rootDir>/src/Blocks/common/__mocks__/wordpress-block-editor.js',
}

module.exports = config
