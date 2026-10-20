import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const DONATION_FORM_SELECTOR = '.wp-block-famehelsinki-donation-form'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const

interface AxeAllowlistEntry {
	ruleId: string
	target?: string
	issueUrl: string
	reason: string
}

/**
 * Temporary axe exclusions must be narrow, justified and linked to an issue.
 * An empty allowlist is the goal. Do not add an entry without a removal plan.
 */
const AXE_ALLOWLIST: readonly AxeAllowlistEntry[] = []

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]
type AxeNode = AxeViolation['nodes'][number]

interface UnexpectedViolation {
	violation: AxeViolation
	nodes: AxeNode[]
}

const formatTarget = (target: AxeNode['target']): string =>
	target.map(part => (Array.isArray(part) ? part.join(' > ') : part)).join(' inside ')

const getWcagCriteria = (tags: string[]): string[] =>
	tags
		.filter(tag => /^wcag\d{3,4}$/.test(tag))
		.map(tag => {
			const digits = tag.slice('wcag'.length)
			return `${digits[0]}.${digits[1]}.${digits.slice(2)}`
		})

const isAllowed = (ruleId: string, node: AxeNode): boolean => {
	const target = formatTarget(node.target)
	return AXE_ALLOWLIST.some(
		entry => entry.ruleId === ruleId && (!entry.target || target.includes(entry.target))
	)
}

const formatViolations = (context: string, violations: UnexpectedViolation[]): string => {
	const details = violations.flatMap(({ violation, nodes }) => {
		const criteria = getWcagCriteria(violation.tags)
		const heading = [
			`Rule: ${violation.id}`,
			`WCAG: ${criteria.length > 0 ? criteria.join(', ') : 'not tagged'}`,
			`Impact: ${violation.impact ?? 'unknown'}`,
			`Help: ${violation.help}`,
			`More information: ${violation.helpUrl}`,
		]
		const selectors = nodes.map(node => `  - ${formatTarget(node.target)}`)
		return [...heading, 'Selectors:', ...selectors, '']
	})

	return [`Axe accessibility violations in ${context}:`, '', ...details].join('\n')
}

export async function expectDonationFormToPassAxe(page: Page, context: string): Promise<void> {
	const results = await new AxeBuilder({ page })
		.include(DONATION_FORM_SELECTOR)
		.withTags([...WCAG_TAGS])
		.analyze()

	const unexpected = results.violations
		.map(violation => ({
			violation,
			nodes: violation.nodes.filter(node => !isAllowed(violation.id, node)),
		}))
		.filter(({ nodes }) => nodes.length > 0)

	expect(unexpected, formatViolations(context, unexpected)).toEqual([])
}
