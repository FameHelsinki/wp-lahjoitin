<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-amounts
 *
 * @param array    $attributes
 * @param string   $content
 * @param WP_Block $block
 */

/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$settings   = isset($attributes['settings']) && is_array($attributes['settings']) ? $attributes['settings'] : [];
$other      = array_key_exists('other', $attributes) ? (bool) $attributes['other'] : false;
$otherLabel = isset($attributes['otherLabel']) ? (string) $attributes['otherLabel'] : __('Other amount', 'fame_lahjoitukset');
$showLegend = array_key_exists('showLegend', $attributes) ? (bool) $attributes['showLegend'] : true;
$legend     = isset($attributes['legend']) && trim((string)$attributes['legend']) !== ''
  ? (string) $attributes['legend']
  : __('Donation amount', 'fame_lahjoitukset');

/**
 * Safe int helper.
 */
$int = static function ($value, int $fallback): int {
  if (is_int($value)) return $value;
  if (is_string($value) && $value !== '' && is_numeric($value)) return (int) $value;
  if (is_float($value)) return (int) $value;
  return $fallback;
};

/**
 * Safe string helper.
 */
$str = static function ($value, string $fallback = ''): string {
  return isset($value) ? (string) $value : $fallback;
};

/**
 * Find default type setting.
 */
$defaultSetting = null;
foreach ($settings as $s) {
  if (is_array($s) && !empty($s['default'])) {
    $defaultSetting = $s;
    break;
  }
}
if (!$defaultSetting && !empty($settings) && is_array($settings[0])) {
  $defaultSetting = $settings[0];
}

$DEFAULT_AMOUNT = 10;
$MIN_AMOUNT = 10;
$MAX_AMOUNT = 10000;
$DEFAULT_UNIT = '€';

$defaultAmountEuros = $defaultSetting ? $int($defaultSetting['defaultAmount'] ?? null, $DEFAULT_AMOUNT) : $DEFAULT_AMOUNT;
$defaultAmountCents = $defaultAmountEuros * 100;

// Visible if "other" or any type has amount buttons
$hasButtons = false;
foreach ($settings as $s) {
  if (is_array($s) && !empty($s['amounts']) && is_array($s['amounts'])) {
    foreach ($s['amounts'] as $a) {
      if (is_array($a) && !empty($a['value'])) {
        $hasButtons = true;
        break 2;
      }
    }
  }
}
$visible = $other || $hasButtons;

$wrapper_class = $visible
  ? 'fame-form__fieldset fame-form__fieldset--amounts'
  : 'fame-form__hidden';

$wrapper_attrs = get_block_wrapper_attributes(['class' => $wrapper_class]);

if (!$visible) : ?>
  <div <?php echo $wrapper_attrs; ?>>
    <input name="amount" type="hidden" value="<?php echo esc_attr((string)$defaultAmountCents); ?>" />
  </div>
<?php
  return;
endif;
?>

<fieldset <?php echo $wrapper_attrs; ?>>
  <legend class="fame-form__legend<?php echo $showLegend ? '' : ' screen-reader-text'; ?>">
    <?php echo esc_html($legend); ?>
  </legend>

  <?php foreach ($settings as $typeSetting) :
    if (!is_array($typeSetting)) continue;

    $type         = $str($typeSetting['type'] ?? null, '');
    if ($type === '') continue;

    $isDefault    = !empty($typeSetting['default']);
    $unit         = $str($typeSetting['unit'] ?? null, $DEFAULT_UNIT);
    $minAmount    = $int($typeSetting['minAmount'] ?? null, $MIN_AMOUNT);
    $maxAmount    = $int($typeSetting['maxAmount'] ?? null, $MAX_AMOUNT);
    $defaultEuros = $int($typeSetting['defaultAmount'] ?? null, $DEFAULT_AMOUNT);

    $amounts = isset($typeSetting['amounts']) && is_array($typeSetting['amounts']) ? $typeSetting['amounts'] : [];
  ?>

    <div
      class="<?php echo esc_attr("donation-amounts donation-amounts--{$type}"); ?>"
      data-type="<?php echo esc_attr($type); ?>"
      <?php echo $isDefault ? ' data-default="1"' : ''; ?>
      data-default-amount="<?php echo esc_attr((string) $defaultEuros); ?>"
      data-min-amount="<?php echo esc_attr((string) $minAmount); ?>"
      data-max-amount="<?php echo esc_attr((string) $maxAmount); ?>"
      style="<?php echo $isDefault ? '' : 'display:none'; ?>">
      <?php
      $idx = 0;
      foreach ($amounts as $a) :
        if (!is_array($a)) continue;
        $value = $a['value'] ?? null;
        if ($value === null || $value === '' || !is_numeric($value)) continue;

        $valueStr = (string) (int) $value;
        $id = "{$type}-amount-{$idx}";
        $idx++;
      ?>
        <div class="fame-form__group">
          <label for="<?php echo esc_attr($id); ?>" class="fame-form__label">
            <input
              data-type="<?php echo esc_attr($type); ?>"
              class="fame-form__check-input"
              id="<?php echo esc_attr($id); ?>"
              name="<?php echo esc_attr("amount-radio-{$type}"); ?>"
              value="<?php echo esc_attr($valueStr); ?>"
              type="radio" />
            <?php echo esc_html($valueStr); ?>
            <span class="donation-amounts__unit"><?php echo esc_html($unit); ?></span>
          </label>
        </div>
      <?php endforeach; ?>
    </div>

    <?php if ($other) :
      $otherId = "{$type}-other";
      $minmaxId = "{$type}-minmax";
    ?>
      <div
        class="donation-amounts__other"
        data-type="<?php echo esc_attr($type); ?>"
        style="<?php echo $isDefault ? '' : 'display:none'; ?>">
        <div class="label-wrapper">
          <label for="<?php echo esc_attr($otherId); ?>" class="fame-form__label">
            <?php echo esc_html($otherLabel); ?>
          </label>
          <span class="donation-amounts__unit"><?php echo esc_html($unit); ?></span>
        </div>

        <div class="donation-amounts__input-wrapper">
          <input
            id="<?php echo esc_attr($otherId); ?>"
            class="fame-form__input"
            name="<?php echo esc_attr("amount-{$type}"); ?>"
            type="number"
            min="<?php echo esc_attr((string)$minAmount); ?>"
            max="<?php echo esc_attr((string)$maxAmount); ?>"
            value="<?php echo esc_attr((string)$defaultEuros); ?>"
            aria-describedby="<?php echo esc_attr($minmaxId); ?>" />
          <span class="donation-amounts__minmax" id="<?php echo esc_attr($minmaxId); ?>">
            <?php
            echo esc_html__('Min', 'fame_lahjoitukset') . ' ' . esc_html((string)$minAmount) . esc_html($unit)
              . ' – ' .
              esc_html__('Max', 'fame_lahjoitukset') . ' ' . esc_html((string)$maxAmount) . esc_html($unit);
            ?>
          </span>
        </div>
      </div>
    <?php endif; ?>

  <?php endforeach; ?>

  <!-- Server expects name="amount" (in cents). JS keeps this updated. -->
  <input name="amount" type="hidden" value="<?php echo esc_attr((string)$defaultAmountCents); ?>" />
</fieldset>