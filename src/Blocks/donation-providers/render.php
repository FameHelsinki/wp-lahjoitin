<?php

declare(strict_types=1);

use Fame\WordPress\Lahjoitukset\Settings;

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-providers
 *
 * @var string              $content
 * @var WP_Block            $block
 */


/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$providers = (isset($attributes['providers']) && is_array($attributes['providers']))
  ? $attributes['providers']
  : [];

$legend_raw = trim((string) ($attributes['legend'] ?? ''));
$legend = $legend_raw === '' || in_array($legend_raw, ['Payment provider', 'Provider type'], true)
  ? __('Payment provider', 'fame_lahjoitukset')
  : $legend_raw;

$showLegend = array_key_exists('showLegend', $attributes) ? (bool) $attributes['showLegend'] : true;
$showLegendSingle = array_key_exists('showLegendSingle', $attributes) ? (bool) $attributes['showLegendSingle'] : null;
$showLegendRecurring = array_key_exists('showLegendRecurring', $attributes) ? (bool) $attributes['showLegendRecurring'] : null;

$grouped = [];
foreach ($providers as $p) {
  if (!is_array($p)) {
    continue;
  }

  $type  = isset($p['type']) ? (string) $p['type'] : '';
  $value = isset($p['value']) ? (string) $p['value'] : '';
  $label = isset($p['label']) ? (string) $p['label'] : '';

  if ($type === '' || $value === '') {
    continue;
  }

  if (!isset($grouped[$type])) {
    $grouped[$type] = [];
  }

  $grouped[$type][] = ['type' => $type, 'value' => $value, 'label' => $label];
}

// Filter the saved selection against the providers currently enabled for this
// organization, so a provider disabled after the block was saved never renders.
// Fails closed: when the API is unreachable or the slug is missing, do not show
// stale provider choices that may no longer be valid for this organization.
$enabled = (new Settings())->getEnabledProviders();
$providers_unavailable = !is_array($enabled) || $enabled === [];
$display_provider_label = static function (string $value, string $label): string {
  if (in_array(strtolower($value), ['checkout', 'paytrail'], true)) {
    $normalized_label = strtolower(trim($label));
    // Empty and legacy provider names intentionally mean "use the Paytrail default".
    if ($normalized_label === '' || in_array($normalized_label, ['checkout', 'paytrail'], true)) {
      return 'Paytrail';
    }
  }

  return $label;
};

if ($providers_unavailable) {
  $grouped = [];
} else {
  foreach ($grouped as $type => $list) {
    $filtered = [];
    $priorities = [];

    foreach ($list as $provider) {
      $value = (string) $provider['value'];
      $was_native_paytrail = strtolower($value) === 'paytrail';

      // Migrate legacy Checkout selections when the backend starts exposing
      // the same provider by its current Paytrail machine name.
      if (
        strtolower($value) === 'checkout' &&
        isset($enabled['paytrail']) &&
        $enabled['paytrail']->supportsType((string) $type)
      ) {
        $provider['value'] = 'paytrail';
        $provider['label'] = $display_provider_label('paytrail', (string) $provider['label']);
        $value = 'paytrail';
      }

      if (isset($enabled[$value]) && $enabled[$value]->supportsType((string) $type)) {
        if (in_array(strtolower($value), ['checkout', 'paytrail'], true)) {
          $provider['label'] = $display_provider_label($value, (string) $provider['label']);
        }
        $key = strtolower($value);
        $priority = $was_native_paytrail ? 2 : 1;

        if (!isset($priorities[$key]) || $priority > $priorities[$key]) {
          $filtered[$key] = $provider;
          $priorities[$key] = $priority;
        }
      }
    }

    if ($filtered) {
      $grouped[$type] = array_values($filtered);
    } else {
      unset($grouped[$type]);
    }
  }

  $providers_unavailable = $grouped === [];
}

$isLegendShownForType = static function (string $type) use ($showLegend, $showLegendSingle, $showLegendRecurring): bool {
  if ($type === 'single') {
    return $showLegendSingle ?? $showLegend;
  }
  if ($type === 'recurring') {
    return $showLegendRecurring ?? $showLegend;
  }
  return $showLegend;
};

$wrapper_attrs = get_block_wrapper_attributes();

?>
<div <?php echo $wrapper_attrs; ?>>
  <?php if ($providers_unavailable) : ?>
    <div class="fame-form__notice fame-form__notice--warning" role="status">
      <?php echo esc_html__('Payment methods are currently unavailable. Please try again later.', 'fame_lahjoitukset'); ?>
    </div>
  <?php endif; ?>

  <?php foreach ($grouped as $type => $list) :
    $single = count($list) === 1;
    $showForType = $isLegendShownForType((string) $type);

    $legendAlign_raw = isset($attributes['legendAlign']) ? (string) $attributes['legendAlign'] : 'left';
    $legendAlign     = in_array($legendAlign_raw, ['left', 'center', 'right', 'justify'], true)
      ? $legendAlign_raw
      : 'left';
    $legend_class = 'fame-form__legend' . ($showForType ? '' : ' screen-reader-text');
    $legend_style = 'text-align:' . $legendAlign . ';';
  ?>
    <fieldset
      class="payment-method-selector fame-form__fieldset"
      data-type="<?php echo esc_attr((string) $type); ?>">
      <legend class="<?php echo esc_attr($legend_class); ?>" style="<?php echo esc_attr($legend_style); ?>">
        <?php echo esc_html($legend); ?>
      </legend>

      <?php if ($single) : ?>
        <input
          type="hidden"
          name="provider"
          value="<?php echo esc_attr((string) $list[0]['value']); ?>"
          data-type="<?php echo esc_attr((string) $list[0]['type']); ?>" />
      <?php else : ?>

      <?php foreach ($list as $provider) :
        $ptype = (string) $provider['type'];
        $pval  = (string) $provider['value'];
        $plab  = (string) $provider['label'];

        $id = 'payment_method_' . sanitize_key($ptype) . '_' . sanitize_key($pval);
      ?>
        <div
          class="fame-form__group"
          data-type="<?php echo esc_attr($ptype); ?>">
          <label for="<?php echo esc_attr($id); ?>">
            <input
              class="fame-form__check-input"
              type="radio"
              id="<?php echo esc_attr($id); ?>"
              name="provider"
              value="<?php echo esc_attr($pval); ?>"
              data-type="<?php echo esc_attr($ptype); ?>"
              required />
            <span class="provider-type__label">
              <?php echo esc_html($plab); ?>
            </span>
          </label>
        </div>

      <?php endforeach; ?>
      <?php endif; ?>
    </fieldset>
  <?php endforeach; ?>

  <?php
  // Render InnerBlocks content (e.g. terms paragraph).
  if (!empty($content)) {
    echo $content;
  }
  ?>
</div>
