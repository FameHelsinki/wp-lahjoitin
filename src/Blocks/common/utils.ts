export const formatPlaceholder = (str: string) =>
	str
		.replace(
			/\w\S*/g,
			(text) =>
				text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
		)
		.replace(/_/g, ' ')

export const DEFAULT_AMOUNT = 10

export const formatAmount = (amount: string, def = DEFAULT_AMOUNT) =>
	parseInt(amount, 10) || def
