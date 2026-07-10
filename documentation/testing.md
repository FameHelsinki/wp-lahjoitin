# Testing

All suites run in CI on every pull request (`.github/workflows/test.yml`).

## Unit tests (no WordPress needed)

```sh
npm run test:unit      # Jest, src/**/*.test.ts
composer test:php      # PHPUnit + WP_Mock, tests/Unit/
```

## Integration and e2e tests (wp-env)

These run against a real WordPress in Docker. Build first, then start
[wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/):

```sh
npm run build && composer install
npm run env:start
npm run test:php:integration   # WordPress test suite, tests/Integration/
npm run test:e2e               # Playwright, tests/e2e/
```

The e2e suite simulates the lahjoitin backend with a mu-plugin
(`tests/e2e/mu-plugins/`): organization slug `e2e-ok` has providers enabled,
any other `e2e-*` slug behaves as an unreachable backend. On failure, traces
land in `tests/e2e/artifacts/` (`npx playwright show-trace <trace.zip>`).

First-time e2e setup: `npx playwright install chromium`.
