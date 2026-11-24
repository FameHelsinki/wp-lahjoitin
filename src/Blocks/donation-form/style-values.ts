// Keep this individual-value grammar aligned with PHP StyleValues::color.
// Unsupported or unsafe theme values must use the same fallback in both views.
export function colorValue(value: string | undefined, fallback: string): string {
	const color = (value ?? '').replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '')
	if (
		/^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(color) ||
		/^[a-z]+$/i.test(color)
	)
		return color
	if (!/^[a-z-]+\([a-z0-9#.,%+\-/ \t\r\n\f()]*\)$/i.test(color)) return fallback
	const allowed = new Set([
		'rgb',
		'rgba',
		'hsl',
		'hsla',
		'hwb',
		'lab',
		'lch',
		'oklab',
		'oklch',
		'color',
		'color-mix',
		'light-dark',
		'var',
		'calc',
		'min',
		'max',
		'clamp',
	])
	for (const match of color.matchAll(/([a-z-]+)[ \t\r\n\f]*\(/gi)) {
		if (!allowed.has(match[1].toLowerCase())) return fallback
	}
	let depth = 0
	for (let i = 0; i < color.length; i++) {
		if (color[i] === '(') depth++
		else if (color[i] === ')') {
			depth--
			if (depth < 0 || (depth === 0 && i !== color.length - 1)) return fallback
		}
	}
	return depth === 0 ? color : fallback
}

export function cssLength(value: string | undefined, fallback: string): string {
	return value && /^\d*\.?\d+(px|rem|em|%)$/.test(value) ? value : fallback
}
