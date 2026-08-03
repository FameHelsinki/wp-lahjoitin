<?php

/**
 * Plugin Name: Fame e2e backend mock
 * Description: Test helpers for the Playwright e2e suite. Mounted into wp-env only (see .wp-env.json), never shipped.
 */

declare(strict_types=1);

/**
 * Simulate the lahjoitin backend for e2e organization slugs.
 *
 * Only intercepts `/providers/e2e-*` requests, so a normally configured site
 * is unaffected. The slug picks the scenario:
 *   - e2e-ok:   two providers enabled
 *   - e2e-fail: backend unavailable (HTTP 500)
 */
add_filter('pre_http_request', static function ($preempt, $args, $url) {
    if (!preg_match('#/providers/(e2e-[a-z]+)$#', (string) $url, $matches)) {
        return $preempt;
    }

    $response = static fn(int $code, array $body): array => [
        'headers' => [],
        'body' => (string) json_encode($body),
        'response' => ['code' => $code, 'message' => ''],
        'cookies' => [],
        'filename' => null,
    ];

    return match ($matches[1]) {
        'e2e-ok' => $response(200, [
            ['provider' => 'checkout', 'types' => ['single', 'recurring']],
            ['provider' => 'mobilepay', 'types' => ['single']],
        ]),
        default => $response(500, ['message' => 'Simulated backend failure']),
    };
}, 10, 3);

/**
 * Expose the plugin's "slug" option over /wp/v2/settings so tests can switch
 * scenarios through the REST API. The plugin itself only registers the setting
 * in wp-admin, which the REST context never loads.
 */
add_action('rest_api_init', static function (): void {
    register_setting('options', 'slug', [
        'type' => 'string',
        'default' => '',
        'show_in_rest' => true,
    ]);
});
