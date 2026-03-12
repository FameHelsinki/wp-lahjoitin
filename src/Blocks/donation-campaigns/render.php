<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-campaigns
 *
 * @param array    $attributes
 * @param string   $content
 * @param WP_Block $block
 */

/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$show      = array_key_exists('show', $attributes) ? (bool) $attributes['show'] : false;
$campaigns = isset($attributes['campaigns']) && is_array($attributes['campaigns'])
  ? $attributes['campaigns']
  : [];

if (!$show || empty($campaigns)) {
  return;
}

$showLabel = array_key_exists('showLabel', $attributes) ? (bool) $attributes['showLabel'] : true;
$label     = isset($attributes['label']) && trim((string) $attributes['label']) !== ''
  ? (string) $attributes['label']
  : __('Campaign', 'fame_lahjoitukset');

$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__group',
]);

?>
<div <?php echo $wrapper_attrs; ?>>
  <?php if ($showLabel) : ?>
    <label for="campaign" class="fame-form__label">
      <?php echo esc_html($label); ?>
    </label>
  <?php endif; ?>

  <select name="campaign" id="campaign" class="fame-form__input">
    <option value="" disabled selected>
      <?php echo esc_html__('Select campaign', 'fame_lahjoitukset'); ?>
    </option>

    <?php foreach ($campaigns as $campaign) :
      $value = trim((string) $campaign);
      if ($value === '') continue;
    ?>
      <option value="<?php echo esc_attr($value); ?>">
        <?php echo esc_html($value); ?>
      </option>
    <?php endforeach; ?>
  </select>
</div>