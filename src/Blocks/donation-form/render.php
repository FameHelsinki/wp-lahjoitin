<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-form
 *
 * @var array<string, mixed>|null $attributes
 * @var string|null              $content
 * @var WP_Block|null            $block
 */

$attributes = $attributes ?? [];
$content    = $content ?? '';

if (!function_exists('famehelsinki_sanitize_return_url')) {
  /**
   * Prevent open redirects:
   * - If empty: homepage (absolute)
   * - If relative "/path": convert to absolute with home_url()
   * - If absolute: allow only same-host
   */
  function famehelsinki_sanitize_return_url(string $url): string
  {
    $url = trim($url);

    $home      = home_url('/');
    $site_host = wp_parse_url($home, PHP_URL_HOST);

    if (!$site_host) {
      return $home;
    }

    if ($url === '') {
      return $home;
    }

    // Relative path -> absolute
    if (str_starts_with($url, '/')) {
      return esc_url_raw(home_url($url));
    }

    // Absolute URL -> check host
    $parsed = wp_parse_url($url);
    if (!$parsed || empty($parsed['host'])) {
      return $home;
    }

    if ($parsed['host'] !== $site_host) {
      return $home;
    }

    // Keep user's absolute URL as-is (same host)
    return esc_url_raw($url);
  }
}

$attrs = wp_parse_args($attributes, [
  'returnAddress'         => '/',
  'campaign'              => '',
  'token'                 => false,
  'primaryColor'          => '#000000',
  'secondaryColor'        => '#FFFFFF',
  'thirdColor'            => '#444',
  'borderRadius'          => '0px',
  'borderWidth'           => '1px',
  'textFieldBorderRadius' => '0px',
]);

$container_classes = 'fame-form-container';

$wrapper_style = sprintf(
  '--primary-color:%s;--secondary-color:%s;--third-color:%s;--fame-border-radius:%s;--fame-border-width:%s;--fame-text-field-border-radius:%s;',
  esc_attr($attrs['primaryColor'] ?: 'inherit'),
  esc_attr($attrs['secondaryColor'] ?: 'inherit'),
  esc_attr($attrs['thirdColor'] ?: 'inherit'),
  esc_attr($attrs['borderRadius'] ?: 'inherit'),
  esc_attr($attrs['borderWidth'] ?: 'inherit'),
  esc_attr($attrs['textFieldBorderRadius'] ?: 'inherit')
);

$block_wrapper_attrs = get_block_wrapper_attributes([
  'class' => $container_classes,
]);

$token_attr = !empty($attrs['token']) ? ' data-token="1"' : '';

/**
 * Render inner blocks robustly:
 * - Prefer parsed block tree ($block->inner_blocks)
 * - Fallback to serialized $content
 */
$inner = '';

if ($block instanceof WP_Block && count($block->inner_blocks) > 0) {
  foreach ($block->inner_blocks as $inner_block) {
    $inner .= $inner_block->render();
  }
} else {
  $inner = $content !== '' ? do_blocks($content) : '';
}

$return_address = famehelsinki_sanitize_return_url((string) ($attrs['returnAddress'] ?? '/'));
?>
<div <?php echo $block_wrapper_attrs; ?>>
  <form class="fame-form fame-form--donations" <?php echo $token_attr; ?> novalidate>
    <div class="fame-form__wrapper" style="<?php echo esc_attr($wrapper_style); ?>">
      <?php echo $inner; ?>
    </div>

    <input type="hidden" name="return_address" value="<?php echo esc_attr($return_address); ?>" />
    <input type="hidden" name="provider" data-selected-provider />

    <?php if (!empty($attrs['campaign'])) : ?>
      <input type="hidden" name="campaign" value="<?php echo esc_attr((string) $attrs['campaign']); ?>" />
    <?php endif; ?>
  </form>

  <div class="fame-form-overlay">
    <div class="fame-form-spinner" role="status">
      <span class="screen-reader-text"><?php echo esc_html__('Loading', 'fame_lahjoitukset'); ?></span>
    </div>
  </div>
</div>