<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-providers
 *
 * @var array<string, mixed> $attributes
 * @var string              $content
 * @var WP_Block            $block
 */


/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$providers = (isset($attributes['providers']) && is_array($attributes['providers']))
  ? $attributes['providers']
  : [];

$legend = (isset($attributes['legend']) && trim((string) $attributes['legend']) !== '')
  ? (string) $attributes['legend']
  : __('Payment provider', 'fame_lahjoitukset');

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
  <?php foreach ($grouped as $type => $list) :
    $single = count($list) === 1;
    $showForType = $isLegendShownForType((string) $type);

    $legend_class = 'fame-form__legend' . ($showForType ? '' : ' screen-reader-text');
  ?>
    <fieldset
      class="payment-method-selector fame-form__fieldset"
      data-type="<?php echo esc_attr((string) $type); ?>">
      <legend class="<?php echo esc_attr($legend_class); ?>">
        <?php echo esc_html($legend); ?>
      </legend>

      <?php if ($single) : ?>
        <input
          type="hidden"
          name="provider"
          value="<?php echo esc_attr((string) $list[0]['value']); ?>"
          data-type="<?php echo esc_attr((string) $list[0]['type']); ?>" />
      <?php endif; ?>

      <?php foreach ($list as $provider) :
        $ptype = (string) $provider['type'];
        $pval  = (string) $provider['value'];
        $plab  = (string) $provider['label'];

        $hideSingleLabel = $single && !$showForType;

        $group_class = 'fame-form__group' . ($hideSingleLabel ? ' screen-reader-text' : '');
        $id = 'payment_method_' . sanitize_key($ptype) . '_' . sanitize_key($pval);
      ?>
        <div
          class="<?php echo esc_attr($group_class); ?>"
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
    </fieldset>
  <?php endforeach; ?>
</div>