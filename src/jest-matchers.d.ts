import 'expect'

// WordPress installs these matchers at runtime; its declarations target the
// global Jest namespace rather than the imported @jest/globals expect API.
declare module 'expect' {
	interface Matchers<R extends void | Promise<void>, T = unknown> {
		toHaveErrored(): R
		toHaveErroredWith(...args: unknown[]): R
	}
}
