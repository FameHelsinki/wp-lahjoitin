<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$submit_label = isset($attributes['submitLabel']) ? trim((string) $attributes['submitLabel']) : '';
if ($submit_label === '') {
  $submit_label = __('Donate', 'fame_lahjoitukset');
}

$submit_label_single = isset($attributes['submitLabelSingle']) ? trim((string) $attributes['submitLabelSingle']) : '';
if ($submit_label_single === '') {
  $submit_label_single = $submit_label;
}

$submit_label_recurring = isset($attributes['submitLabelRecurring']) ? trim((string) $attributes['submitLabelRecurring']) : '';
if ($submit_label_recurring === '') {
  $submit_label_recurring = $submit_label;
}

$resolved = ($submit_label_single === $submit_label_recurring)
  ? $submit_label_single
  : $submit_label;

$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__controls',
]);

?>
<div <?php echo $wrapper_attrs; ?>>
  <button
    disabled
    type="submit"
    class="wp-element-button is-primary"
    data-label-single="<?php echo esc_attr($submit_label_single); ?>"
    data-label-recurring="<?php echo esc_attr($submit_label_recurring); ?>">
    <?php echo esc_html($resolved); ?>
  </button>

  <noscript>
    <?php echo esc_html__('Please enable JavaScript to use this form.', 'fame_lahjoitukset'); ?>
  </noscript>
</div>