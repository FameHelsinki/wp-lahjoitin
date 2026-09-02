<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Render the recurring charge-day selector. FormHandler enables the field only
 * while the recurring donation type is selected, so single donations never
 * submit a due_date value.
 *
 * @var array<string, mixed>|null $attributes
 */

$attributes = $attributes ?? [];

$label_raw = trim((string) ($attributes['label'] ?? ''));
$label = $label_raw === '' || $label_raw === 'Charge day'
  ? __('Charge day', 'fame_lahjoitukset')
  : $label_raw;
$show_label = array_key_exists('showLabel', $attributes) ? (bool) $attributes['showLabel'] : true;
$allow_donor_selection = array_key_exists('allowDonorSelection', $attributes)
  ? (bool) $attributes['allowDonorSelection']
  : true;
$default_day = isset($attributes['defaultDay']) ? (int) $attributes['defaultDay'] : 5;
$default_day = max(1, min(28, $default_day));
$select_id = wp_unique_id('recurring-due-date-');
$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__fieldset recurring-due-date',
  'data-recurring-due-date' => '1',
  'data-show-selector' => $allow_donor_selection ? '1' : '0',
  'hidden' => 'hidden',
  'aria-hidden' => 'true',
]);
?>
<div <?php echo $wrapper_attrs; ?>>
  <?php if ($allow_donor_selection) : ?>
    <label
    for="<?php echo esc_attr($select_id); ?>"
    class="<?php echo esc_attr($show_label ? 'fame-form__label' : 'fame-form__label screen-reader-text'); ?>">
    <?php echo esc_html($label); ?>
    </label>
    <select
    id="<?php echo esc_attr($select_id); ?>"
    name="due_date"
    class="fame-form__input"
    data-recurring-due-date-input
    required
    disabled>
    <?php for ($day = 1; $day <= 28; $day++) : ?>
      <option value="<?php echo esc_attr((string) $day); ?>" <?php selected($day, $default_day); ?>>
        <?php echo esc_html((string) $day); ?>
      </option>
    <?php endfor; ?>
    </select>
    <span class="fame-form__help">
      <?php echo esc_html__('The donation will be charged on this day each month.', 'fame_lahjoitukset'); ?>
    </span>
  <?php else : ?>
    <input
      type="hidden"
      name="due_date"
      value="<?php echo esc_attr((string) $default_day); ?>"
      data-recurring-due-date-input
      disabled>
  <?php endif; ?>
</div>
