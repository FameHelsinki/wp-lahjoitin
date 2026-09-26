<?php

/**
 * Plugin Name: Lahjoitin demo
 * Description: Demo content and a simulated lahjoitin backend for WordPress Playground. Never install on a real site.
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

const LAHJOITIN_DEMO_SLUG = 'demo';

/**
 * Route the plugin's backend calls to this site instead of api.lahjoitin.fi.
 *
 * The plugin reads FAME_BACKEND_URL on every call, so both the providers
 * lookup and the browser-side donation POST end up in the mocks below. No
 * request ever leaves the Playground.
 */
add_action('init', static function (): void {
    putenv('FAME_BACKEND_URL=' . untrailingslashit(get_rest_url(null, 'lahjoitin-demo/v1')));
}, 0);

/**
 * Answer the server-side `/providers/{slug}` lookup without a loopback request.
 */
add_filter('pre_http_request', static function ($preempt, $args, $url) {
    if (!str_ends_with((string) $url, '/providers/' . LAHJOITIN_DEMO_SLUG)) {
        return $preempt;
    }

    return [
        'headers' => [],
        'body' => (string) wp_json_encode([
            ['provider' => 'checkout', 'types' => ['single', 'recurring']],
            ['provider' => 'mobilepay', 'types' => ['single']],
        ]),
        'response' => ['code' => 200, 'message' => 'OK'],
        'cookies' => [],
        'filename' => null,
    ];
}, 10, 3);

/**
 * Simulate the donation endpoint the form posts to.
 *
 * The real backend creates a payment and returns the provider's checkout URL.
 * Here we skip payment and send the donor straight to the thank-you page with
 * the submitted fields, so the whole form flow can be tried end to end.
 */
add_action('rest_api_init', static function (): void {
    register_rest_route('lahjoitin-demo/v1', '/donation/(?P<slug>[a-z0-9-]+)', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => static function (WP_REST_Request $request): WP_REST_Response {
            $data = (array) $request->get_json_params();

            $fields = ['type', 'amount', 'provider', 'campaign', 'due_date', 'first_name', 'last_name', 'email', 'address', 'postal_code', 'city', 'phone'];
            $args = ['lahjoitin_demo' => 1];
            foreach ($fields as $field) {
                if (isset($data[$field]) && is_scalar($data[$field]) && (string) $data[$field] !== '') {
                    $args[$field] = sanitize_text_field((string) $data[$field]);
                }
            }

            $thanks = (int) get_option('lahjoitin_demo_thanks_page');

            return new WP_REST_Response([
                'redirect_url' => add_query_arg(array_map('rawurlencode', $args), get_permalink($thanks) ?: home_url('/')),
            ]);
        },
    ]);
});

/**
 * Remind visitors that nothing is charged.
 */
add_filter('render_block_famehelsinki/donation-form', static function (string $html): string {
    $notice = sprintf(
        '<p class="lahjoitin-demo-notice" style="padding:.75em 1em;border-left:4px solid #f0b849;background:#fcf9e8;font-size:.9em;">%s</p>',
        esc_html__('Demo mode: no payment is made. Submitting the form shows the data that would be sent to lahjoitin.fi.', 'lahjoitin-demo')
    );

    return $notice . $html;
});

/**
 * Show the submitted donation on the thank-you page.
 */
add_filter('the_content', static function (string $content): string {
    if (!is_page((int) get_option('lahjoitin_demo_thanks_page')) || empty($_GET['lahjoitin_demo'])) {
        return $content;
    }

    $labels = [
        'type' => 'Donation type',
        'amount' => 'Amount',
        'provider' => 'Payment provider',
        'campaign' => 'Campaign',
        'due_date' => 'Charge day',
        'first_name' => 'First name',
        'last_name' => 'Last name',
        'email' => 'Email',
        'address' => 'Address',
        'postal_code' => 'Postal code',
        'city' => 'City',
        'phone' => 'Phone',
    ];

    $readable = [
        'type' => ['single' => 'One-time', 'recurring' => 'Monthly'],
        'provider' => ['checkout' => 'Paytrail', 'mobilepay' => 'MobilePay'],
    ];

    $rows = '';
    foreach ($labels as $key => $label) {
        if (!isset($_GET[$key]) || !is_string($_GET[$key])) {
            continue;
        }

        $value = sanitize_text_field(wp_unslash($_GET[$key]));
        $value = $readable[$key][$value] ?? $value;
        if ($key === 'amount') {
            $value = number_format_i18n((int) $value / 100, 2) . ' €';
        }

        $rows .= sprintf('<tr><th scope="row">%s</th><td>%s</td></tr>', esc_html($label), esc_html($value));
    }

    return $content . '<figure class="wp-block-table"><table><tbody>' . $rows . '</tbody></table></figure>';
});

/**
 * Create the demo pages. Run once from the Playground blueprint.
 */
function lahjoitin_demo_install(): void
{
    update_option('slug', LAHJOITIN_DEMO_SLUG);
    update_option('permalink_structure', '/%postname%/');
    update_option('blogname', 'Lahjoitin demo');
    update_option('blogdescription', 'Donation forms for WordPress by lahjoitin.fi');

    // Skip the block editor welcome guide so visitors land straight on the form.
    update_user_meta(1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [
        'core/edit-post' => ['welcomeGuide' => false],
        'core' => ['welcomeGuide' => false],
        '_modified' => gmdate('c'),
    ]);

    $dir = __DIR__ . '/lahjoitin-demo';

    $thanks = lahjoitin_demo_page('Thank you!', 'thank-you', lahjoitin_demo_content("$dir/thank-you.html"), false);
    update_option('lahjoitin_demo_thanks_page', $thanks);

    $forms = [
        'simple' => lahjoitin_demo_page('Simple donation', 'simple-donation', lahjoitin_demo_content("$dir/simple.html")),
        'full' => lahjoitin_demo_page('All features', 'all-features', lahjoitin_demo_content("$dir/full.html")),
    ];

    $home = lahjoitin_demo_page('Lahjoitin demo', 'home', strtr(lahjoitin_demo_content("$dir/home.html"), [
        '{{simple}}' => esc_url(get_permalink($forms['simple'])),
        '{{full}}' => esc_url(get_permalink($forms['full'])),
    ]));

    update_option('show_on_front', 'page');
    update_option('page_on_front', $home);

    // Block themes fall back to the newest wp_navigation post in the header.
    $links = '';
    foreach ($forms as $id) {
        $links .= sprintf(
            '<!-- wp:navigation-link {"label":"%s","type":"page","id":%d,"url":"%s","kind":"post-type"} /-->',
            esc_attr(get_the_title($id)),
            $id,
            esc_url(get_permalink($id))
        );
    }
    wp_insert_post([
        'post_type' => 'wp_navigation',
        'post_status' => 'publish',
        'post_title' => 'Demo menu',
        'post_content' => $links,
    ]);

    flush_rewrite_rules();
}

/**
 * Read page content, pointing {{img:file}} placeholders at the theme's images.
 *
 * Twenty Twenty-Five ships public domain photos for its patterns, so the demo
 * can use them without uploading anything.
 */
function lahjoitin_demo_content(string $file): string
{
    return (string) preg_replace_callback(
        '/\{\{img:([a-z0-9.-]+)\}\}/',
        static fn(array $m): string => esc_url(get_theme_file_uri('assets/images/' . $m[1])),
        (string) file_get_contents($file)
    );
}

/**
 * Insert a published page and return its ID.
 *
 * Pages that bring their own H1 use the theme's template without a title.
 */
function lahjoitin_demo_page(string $title, string $slug, string $content, bool $hideTitle = true): int
{
    return (int) wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_author' => 1,
        'post_title' => $title,
        'post_name' => $slug,
        'post_content' => $content,
        'page_template' => $hideTitle ? 'page-no-title' : '',
    ], true);
}
