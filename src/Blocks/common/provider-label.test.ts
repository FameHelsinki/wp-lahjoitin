import { defaultProviderLabel, providerDisplayLabel } from './provider-label.ts'

describe('provider display labels', () => {
	test('shows the legacy checkout provider as Paytrail', () => {
		expect(defaultProviderLabel('checkout')).toBe('Paytrail')
		expect(providerDisplayLabel('checkout', 'Checkout')).toBe('Paytrail')
	})

	test('keeps the current Paytrail name stable', () => {
		expect(defaultProviderLabel('paytrail')).toBe('Paytrail')
		expect(providerDisplayLabel('paytrail', 'Paytrail')).toBe('Paytrail')
	})

	test('keeps a custom Paytrail label editable', () => {
		expect(providerDisplayLabel('checkout', 'Verkkomaksu')).toBe('Verkkomaksu')
		expect(providerDisplayLabel('paytrail', 'Online payment')).toBe('Online payment')
	})

	test('does not rename other or future providers', () => {
		expect(defaultProviderLabel('mobilepay')).toBe('Mobilepay')
		expect(providerDisplayLabel('future-provider', 'Future provider')).toBe('Future provider')
	})
})
