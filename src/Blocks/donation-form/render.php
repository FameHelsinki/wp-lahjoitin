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
  'primaryColor'          => '#000000',
  'secondaryColor'        => '#FFFFFF',
  'buttonBorderColor'     => '',
  'thirdColor'            => '#444',
  'borderRadius'          => '0px',
  'borderWidth'           => '1px',
  'textFieldBorderRadius' => '0px',
  'dangerColor'           => '#dc3545',
  'sectionLabelFontWeight' => '',
  'sectionLabelColor'     => '',
  'sectionLabelFontSize'  => '1.25em',
]);

$valid_color = static fn($value, string $fallback): string =>
  \Fame\WordPress\Lahjoitukset\StyleValues::color((string) $value, $fallback);

$primary_color       = $valid_color($attrs['primaryColor'], '#000000');
$secondary_color     = $valid_color($attrs['secondaryColor'], '#FFFFFF');
$third_color         = $valid_color($attrs['thirdColor'], '#444');
$danger_color        = $valid_color($attrs['dangerColor'], '#dc3545');
$button_border_color = $valid_color($attrs['buttonBorderColor'], $primary_color);
$section_label_color = $valid_color($attrs['sectionLabelColor'], 'inherit');
$valid_css_length = static function ($value, string $fallback): string {
  $length = (string) $value;
  return preg_match('/^\d*\.?\d+(px|rem|em|%)$/', $length) ? $length : $fallback;
};
$border_radius           = $valid_css_length($attrs['borderRadius'], '0px');
$border_width            = $valid_css_length($attrs['borderWidth'], '1px');
$text_field_border_radius = $valid_css_length($attrs['textFieldBorderRadius'], '0px');
$section_label_size      = $valid_css_length($attrs['sectionLabelFontSize'], '1.25em');

$section_label_weight = \Fame\WordPress\Lahjoitukset\StyleValues::fontWeight((string) $attrs['sectionLabelFontWeight']);

$wrapper_style = sprintf(
  '--primary-color:%s;--secondary-color:%s;--button-border-color:%s;--third-color:%s;--border-radius:%s;--border-width:%s;--text-field-border-radius:%s;--fame-clr-danger:%s;--section-label-color:%s;--section-label-font-size:%s;',
  esc_attr($primary_color),
  esc_attr($secondary_color),
  esc_attr($button_border_color),
  esc_attr($third_color),
  esc_attr($border_radius),
  esc_attr($border_width),
  esc_attr($text_field_border_radius),
  esc_attr($danger_color),
  esc_attr($section_label_color),
  esc_attr($section_label_size)
);

if ($section_label_weight !== '') {
  $wrapper_style .= '--section-label-font-weight:' . esc_attr($section_label_weight) . ';';
}

$editable_layout = (int) ($attributes['layoutVersion'] ?? 0) >= 1;
$classes = 'fame-form-container fame-form__wrapper' . ($editable_layout ? ' fame-form--editable-layout' : '');
$align = $attributes['align'] ?? '';
if ($align !== 'wide' && $align !== 'full') {
  $width = $attributes['formWidth'] ?? '';
  $custom_width = $attributes['formMaxWidth'] ?? 0;
  if ($width === 'content') {
    $wrapper_style .= '--fame-form-max-width:var(--wp--style--global--content-size,100%);';
    $classes .= ' fame-form--width-limited';
  } elseif ($width === 'custom' && is_int($custom_width) && $custom_width > 0) {
    $wrapper_style .= '--fame-form-max-width:' . $custom_width . 'px;';
    $classes .= ' fame-form--width-limited';
  }
}

$block_wrapper_attrs = get_block_wrapper_attributes([
  'class' => $classes,
]);

// Recent WordPress versions run wrapper styles through safe-CSS again,
// dropping rgb()/hsl() values in custom properties. Append only our validated
// declarations after retrieving core's already-sanitized block-support styles.
$escaped_style = esc_attr($wrapper_style);
if (str_contains($block_wrapper_attrs, 'style="')) {
  $block_wrapper_attrs = str_replace('style="', 'style="' . $escaped_style, $block_wrapper_attrs);
} else {
  $block_wrapper_attrs .= ' style="' . $escaped_style . '"';
}

$unavailable = static function (): void {
  echo '<div class="fame-form__notice fame-form__notice--warning" role="status">'
    . esc_html__('The donation form is temporarily unavailable because its configuration is incomplete.', 'fame_lahjoitukset')
    . '</div>';
};

// Validate only this form's own sections. A nested form cannot satisfy its
// parent's requirements, and native form blocks must never enter its markup.
if ($block instanceof WP_Block) {
  $names = [];
  $invalid_nested_form = false;
  $additional_field_keys = [];
  $duplicate_additional_field = false;
  $forbidden = \Fame\WordPress\Lahjoitukset\FormContent::forbiddenNames();
  $collect = static function ($children) use (
    &$collect, &$names, &$invalid_nested_form, &$additional_field_keys, &$duplicate_additional_field, $forbidden
  ): void {
    foreach ($children as $child) {
      if (in_array($child->name, $forbidden, true)) {
        $invalid_nested_form = true;
        continue;
      }
      $names[] = $child->name;
      if ($child->name === 'famehelsinki/custom-data-field') {
        $key = \Fame\WordPress\Lahjoitukset\FormContent::additionalFieldKey($child->attributes['fieldKey'] ?? '');
        if ($key !== '') {
          $duplicate_additional_field = $duplicate_additional_field || isset($additional_field_keys[$key]);
          $additional_field_keys[$key] = true;
        }
      }
      $collect($child->inner_blocks);
    }
  };
  $collect($block->inner_blocks);
  $required = ['famehelsinki/donation-type', 'famehelsinki/donation-amounts',
    'famehelsinki/donation-providers', 'famehelsinki/form-controls'];
  if ($invalid_nested_form) {
    echo '<div class="fame-form__notice fame-form__notice--warning" role="status">'
      . esc_html__('The donation form contains another form. Move the embedded form outside the donation form.', 'fame_lahjoitukset')
      . '</div>';
    return;
  }
  if ($duplicate_additional_field || array_diff($required, $names)) {
    $unavailable();
    return;
  }
}

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
  $inner = $content;
}

// Third-party blocks or shortcodes may also produce forms. Fail safely even
// when their output was not detectable from block names in the saved tree.
if (\Fame\WordPress\Lahjoitukset\FormContent::hasForm($inner)) {
  echo '<div class="fame-form__notice fame-form__notice--warning" role="status">'
    . esc_html__('The donation form contains another form. Move the embedded form outside the donation form.', 'fame_lahjoitukset')
    . '</div>';
  return;
}
$inner = \Fame\WordPress\Lahjoitukset\FormContent::prepareHtml($inner);

$return_address = famehelsinki_sanitize_return_url((string) ($attrs['returnAddress'] ?? '/'));

global $wp;
$cancel_address = famehelsinki_sanitize_return_url(
  home_url(user_trailingslashit((string) ($wp->request ?? '')))
);
?>
<div <?php echo $block_wrapper_attrs; ?>>
  <form class="fame-form fame-form--donations" novalidate>
    <div class="fame-form__inner">
      <?php echo $inner; ?>
    </div>

    <input type="hidden" name="return_address" value="<?php echo esc_attr($return_address); ?>" />
    <input type="hidden" name="cancel_address" value="<?php echo esc_attr($cancel_address); ?>" />
    <input type="hidden" name="provider" data-selected-provider />

  </form>

  <div class="fame-form-overlay">
    <div class="fame-form-spinner" role="status">
      <span class="screen-reader-text"><?php echo esc_html__('Loading', 'fame_lahjoitukset'); ?></span>
    </div>
  </div>
</div>
