import { describe, test, expect } from '@jest/globals'
import { colorValue } from './style-values'

describe('editor CSS color values', () => {
	test.each([
		'#abc',
		'#123456',
		'transparent',
		'rgb(30 30 30)',
		'rgba(10, 20, 30, .5)',
		'hsl(120 30% 40%)',
		'oklch(60% 0.2 240)',
		'light-dark(#fff, #000)',
		'color-mix(in srgb, var(--wp--preset--color--accent) 50%, #fff)',
		'var(--wp--preset--color--accent)',
	])('preserves supported palette value %s', color => {
		expect(colorValue(color, '#000')).toBe(color)
	})

	test.each([
		'',
		'url(https://example.com)',
		'red;display:none',
		'rgb(0 0 0);color:red',
		'expression(alert(1))',
		'var(--x))',
		'rgb(0 0 0) rgb(1 1 1)',
		'rgb(0/**/0/**/0)',
		'var(--x, url(https://example.com))',
		'unsupported(1 2 3)',
	])('uses the PHP fallback for unsafe or unsupported value %s', color => {
		expect(colorValue(color, '#000')).toBe('#000')
	})
})
