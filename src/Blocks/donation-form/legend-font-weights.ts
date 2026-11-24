type FontFace = { fontWeight?: string | number; fontStyle?: string }
type FontFamily = { fontFamily?: string; fontFace?: FontFace[] }

/** Theme presets can be a flat array or grouped by origin (theme/custom/default). */
function familiesFrom(value: unknown): FontFamily[] {
	if (Array.isArray(value)) return value.flatMap(familiesFrom)
	if (!value || typeof value !== 'object') return []
	if ('fontFamily' in value) return [value as FontFamily]
	return Object.values(value).flatMap(familiesFrom)
}

function names(value: string): string[] {
	return value.split(',').map(name =>
		name
			.trim()
			.replace(/^['"]|['"]$/g, '')
			.toLowerCase()
	)
}

/** Only offer weights declared for the first matching font in the CSS stack. */
export function legendFontWeights(presets: unknown, computedFamily: string): string[] {
	const families = familiesFrom(presets)
	const family = names(computedFamily)
		.map(name => families.find(preset => names(preset.fontFamily ?? '')[0] === name))
		.find(Boolean)
	if (!family) return []
	const weights = new Set<number>()
	for (const face of family.fontFace ?? []) {
		if (face.fontStyle && face.fontStyle !== 'normal') continue
		const weight = String(face.fontWeight ?? 'normal')
		if (weight === 'normal') weights.add(400)
		else if (weight === 'bold') weights.add(700)
		else if (/^\d+(?:\s+\d+)?$/.test(weight)) {
			const [start, end = start] = weight.split(/\s+/).map(Number)
			if (start < 1 || end > 1000 || start > end) continue
			weights.add(start)
			weights.add(end)
			for (let n = Math.ceil(start / 100) * 100; n <= end; n += 100) weights.add(n)
		}
	}
	return [...weights].sort((a, b) => a - b).map(String)
}
