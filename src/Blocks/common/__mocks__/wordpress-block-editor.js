/* eslint-disable */

module.exports = {
	useBlockProps: {
		save: jest.fn(() => ({ className: 'mock-block-props' })),
	},
	useInnerBlocksProps: {
		save: jest.fn(() => ({ className: 'mock-inner-block-props' })),
	},
}
