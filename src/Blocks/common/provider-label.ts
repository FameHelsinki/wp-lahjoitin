/** Whether the machine name belongs to Paytrail or its legacy Checkout alias. */
export function isPaytrailProvider(value: string): boolean {
	return value.toLowerCase() === 'checkout' || value.toLowerCase() === 'paytrail'
}

/** Derives a public display label from a provider machine name. */
export function defaultProviderLabel(value: string): string {
	if (isPaytrailProvider(value)) {
		return 'Paytrail'
	}

	return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Returns the public provider name without changing the machine value used for
 * payments. Checkout is Paytrail's legacy machine name.
 */
export function providerDisplayLabel(value: string, label?: string): string {
	if (isPaytrailProvider(value)) {
		const normalizedLabel = label?.trim().toLowerCase()
		// Empty and legacy provider names intentionally mean “use the Paytrail default”.
		if (!normalizedLabel || normalizedLabel === 'checkout' || normalizedLabel === 'paytrail') {
			return 'Paytrail'
		}

		return label as string
	}

	return label || defaultProviderLabel(value)
}
