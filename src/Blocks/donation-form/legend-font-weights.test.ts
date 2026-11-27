import { describe, test, expect } from '@jest/globals'
import { legendFontWeights } from './legend-font-weights'

describe('theme legend font weights', () => {
	test('reads only the matching font and normal styles from grouped theme presets', () => {
		expect(
			legendFontWeights(
				{
					theme: [
						{ fontFamily: 'Other', fontFace: [{ fontWeight: '900' }] },
						{
							fontFamily: '"Site Font", sans-serif',
							fontFace: [
								{ fontWeight: 'normal' },
								{ fontWeight: 'bold' },
								{ fontWeight: '300', fontStyle: 'italic' },
							],
						},
					],
				},
				'"Site Font", sans-serif'
			)
		).toEqual(['400', '700'])
	})

	test('expands variable font ranges without inventing unsupported weights', () => {
		expect(
			legendFontWeights(
				[{ fontFamily: 'Variable', fontFace: [{ fontWeight: '250 650' }] }],
				'Variable'
			)
		).toEqual(['250', '300', '400', '500', '600', '650'])
	})

	test('returns no options when the theme does not declare the current font weights', () => {
		expect(legendFontWeights(undefined, 'Arial')).toEqual([])
		expect(legendFontWeights([{ fontFamily: 'Arial' }], 'Arial')).toEqual([])
	})
})
