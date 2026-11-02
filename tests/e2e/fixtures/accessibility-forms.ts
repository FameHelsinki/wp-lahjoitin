import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright'

export type AccessibilityFormScenario = 'minimal' | 'optional-contact' | 'all-features'

export interface AccessibilityFormFixture {
	title: string
	content: string
}

export interface AccessibilityFormPage extends AccessibilityFormFixture {
	id: number
	url: string
}

type BlockAttributes = Record<string, unknown>

const block = (name: string, attributes?: BlockAttributes): string => {
	const serializedAttributes = attributes ? ` ${JSON.stringify(attributes)}` : ''
	return `<!-- wp:${name}${serializedAttributes} /-->`
}

const group = (content: string): string => `<!-- wp:group -->
<div class="wp-block-group">${content}</div>
<!-- /wp:group -->`

const column = (content: string): string => `<!-- wp:column -->
<div class="wp-block-column">${content}</div>
<!-- /wp:column -->`

const providers = (
	attributes: BlockAttributes
): string => `<!-- wp:famehelsinki/donation-providers ${JSON.stringify(attributes)} -->
<!-- wp:paragraph {"className":"fame-form__terms"} -->
<p class="fame-form__terms">Test privacy policy and payment terms.</p>
<!-- /wp:paragraph -->
<!-- /wp:famehelsinki/donation-providers -->`

interface DonationFormBlocks {
	form?: BlockAttributes
	type: BlockAttributes
	campaigns?: BlockAttributes
	amounts: BlockAttributes
	dueDate?: BlockAttributes
	contact: BlockAttributes
	providers: BlockAttributes
	controls?: BlockAttributes
	columns?: 1 | 2
}

const donationForm = ({
	form,
	type,
	campaigns,
	amounts,
	dueDate,
	contact,
	providers: providerAttributes,
	controls,
	columns = 1,
}: DonationFormBlocks): string => {
	const choices = group(
		[
			block('famehelsinki/donation-type', type),
			block('famehelsinki/donation-campaigns', campaigns),
			block('famehelsinki/donation-amounts', amounts),
			block('famehelsinki/recurring-due-date', dueDate),
		].join('\n\n')
	)
	const details = group(block('famehelsinki/contact-form', contact))
	const payment = group(
		[providers(providerAttributes), block('famehelsinki/form-controls', controls)].join('\n\n')
	)
	const columnMarkup =
		columns === 2
			? column(choices) + column(`${details}\n\n${payment}`)
			: column(`${choices}\n\n${details}\n\n${payment}`)
	const serializedFormAttributes = form ? ` ${JSON.stringify(form)}` : ''

	return `<!-- wp:famehelsinki/donation-form${serializedFormAttributes} -->
<!-- wp:columns -->
<div class="wp-block-columns">${columnMarkup}</div>
<!-- /wp:columns -->
<!-- /wp:famehelsinki/donation-form -->`
}

const amountSettings = {
	single: {
		type: 'single',
		default: true,
		defaultAmount: 20,
		minAmount: 5,
		maxAmount: 10000,
		helpText: 'Minimum 5 €',
		unit: '€',
		amounts: [{ value: 10 }, { value: 20 }, { value: 50 }],
	},
	recurring: {
		type: 'recurring',
		default: false,
		defaultAmount: 10,
		minAmount: 5,
		maxAmount: 1000,
		helpText: 'Between 5 € and 1 000 € per month',
		unit: '€',
		amounts: [{ value: 10 }, { value: 20 }, { value: 30 }],
	},
}

export const accessibilityFormFixtures: Record<
	AccessibilityFormScenario,
	AccessibilityFormFixture
> = {
	minimal: {
		title: 'Accessibility fixture: minimal',
		content: donationForm({
			form: {
				primaryColor: '#1e7b4f',
				thirdColor: '#1e7b4f',
				borderRadius: '8px',
				textFieldBorderRadius: '8px',
			},
			type: {
				value: 'single',
				types: [{ value: 'single', label: 'One-time' }],
			},
			amounts: { settings: [amountSettings.single] },
			contact: { show: false },
			providers: {
				providers: [
					{
						value: 'checkout',
						label: 'Paytrail',
						types: ['single', 'recurring'],
						type: 'single',
					},
				],
			},
			controls: { submitLabel: 'Donate now' },
		}),
	},
	'optional-contact': {
		title: 'Accessibility fixture: optional contact',
		content: donationForm({
			form: {
				primaryColor: '#663399',
				thirdColor: '#663399',
				borderRadius: '6px',
				textFieldBorderRadius: '6px',
			},
			type: {
				showLegend: false,
				value: 'recurring',
				types: [
					{ value: 'recurring', label: 'Monthly' },
					{ value: 'single', label: 'One-time' },
				],
			},
			campaigns: { campaigns: ['General donations'] },
			amounts: {
				settings: [
					{ ...amountSettings.single, default: false },
					{ ...amountSettings.recurring, default: true },
				],
				showLegend: false,
				other: true,
				otherLabel: 'Other amount',
			},
			dueDate: { days: [5] },
			contact: {
				contact: false,
				showAddress: false,
				showPhone: false,
				showLegend: false,
			},
			providers: {
				providers: [
					{
						value: 'checkout',
						label: 'Paytrail',
						types: ['single', 'recurring'],
						type: 'single',
					},
					{
						value: 'checkout',
						label: 'Paytrail',
						types: ['single', 'recurring'],
						type: 'recurring',
					},
				],
			},
			controls: {
				submitLabelSingle: 'Donate once',
				submitLabelRecurring: 'Start monthly donation',
			},
		}),
	},
	'all-features': {
		title: 'Accessibility fixture: all features',
		content: donationForm({
			form: {
				colsDesktop: 2,
				primaryColor: '#9f1d35',
				thirdColor: '#9f1d35',
				sectionLabelColor: '#9f1d35',
				borderRadius: '4px',
				borderWidth: '2px',
				textFieldBorderRadius: '4px',
			},
			type: {
				value: 'single',
				types: [
					{ value: 'single', label: 'One-time' },
					{ value: 'recurring', label: 'Monthly' },
				],
			},
			campaigns: {
				label: 'Support a campaign',
				campaigns: ['Where needed most', 'Emergency relief', 'Education programme'],
			},
			amounts: {
				settings: [amountSettings.single, amountSettings.recurring],
				other: true,
				otherLabel: 'Other amount',
			},
			dueDate: { days: [5, 15, 25] },
			contact: {
				contact: true,
				showAddress: true,
				showPhone: true,
				legend: 'Contact details',
				email_help: 'Your receipt is sent to this address.',
				city_postal_code_help: 'Address fields are optional.',
			},
			providers: {
				legend: 'Payment method',
				providers: [
					{
						value: 'checkout',
						label: 'Paytrail',
						types: ['single', 'recurring'],
						type: 'single',
					},
					{
						value: 'mobilepay',
						label: 'MobilePay',
						types: ['single'],
						type: 'single',
					},
					{
						value: 'checkout',
						label: 'Paytrail',
						types: ['single', 'recurring'],
						type: 'recurring',
					},
				],
			},
			controls: {
				submitLabelSingle: 'Donate',
				submitLabelRecurring: 'Become a monthly donor',
			},
			columns: 2,
		}),
	},
}

export async function createAccessibilityFormPages(
	requestUtils: RequestUtils
): Promise<Record<AccessibilityFormScenario, AccessibilityFormPage>> {
	const pages: Partial<Record<AccessibilityFormScenario, AccessibilityFormPage>> = {}

	try {
		for (const [scenario, fixture] of Object.entries(accessibilityFormFixtures) as [
			AccessibilityFormScenario,
			AccessibilityFormFixture,
		][]) {
			const post = await requestUtils.rest({
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					title: fixture.title,
					content: fixture.content,
					status: 'publish',
				},
			})

			pages[scenario] = {
				...fixture,
				id: post.id as number,
				url: `/?p=${post.id}`,
			}
		}
	} catch (error) {
		// Best-effort cleanup must not hide the original creation failure.
		await deleteAccessibilityFormPages(requestUtils, pages).catch(() => undefined)
		throw error
	}

	return pages as Record<AccessibilityFormScenario, AccessibilityFormPage>
}

export async function deleteAccessibilityFormPages(
	requestUtils: RequestUtils,
	pages: Partial<Record<AccessibilityFormScenario, AccessibilityFormPage>>
): Promise<void> {
	const fixtures = Object.entries(pages) as [AccessibilityFormScenario, AccessibilityFormPage][]
	const results = await Promise.allSettled(
		fixtures.map(([, page]) =>
			requestUtils.rest({
				path: `/wp/v2/posts/${page.id}`,
				method: 'DELETE',
				params: { force: true },
			})
		)
	)
	const failures = results.flatMap((result, index) => {
		if (result.status !== 'rejected') return []
		const [scenario, page] = fixtures[index]
		const reason =
			result.reason instanceof Error ? result.reason.message : String(result.reason)
		return [new Error(`${scenario} (post ${page.id}): ${reason}`)]
	})
	if (failures.length > 0) {
		throw new AggregateError(
			failures,
			'Failed to delete one or more accessibility fixture pages'
		)
	}
}
