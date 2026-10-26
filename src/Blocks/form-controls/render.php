<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$submit_label = isset($attributes['submitLabel']) ? trim((string) $attributes['submitLabel']) : '';
if ($submit_label === '' || $submit_label === 'Donate') {
  $submit_label = __('Donate', 'fame_lahjoitukset');
}

$submit_label_single = isset($attributes['submitLabelSingle']) ? trim((string) $attributes['submitLabelSingle']) : '';
if ($submit_label_single === '' || $submit_label_single === 'Donate') {
  $submit_label_single = $submit_label;
}

$submit_label_recurring = isset($attributes['submitLabelRecurring']) ? trim((string) $attributes['submitLabelRecurring']) : '';
if ($submit_label_recurring === '' || $submit_label_recurring === 'Donate') {
  $submit_label_recurring = $submit_label;
}

$resolved = ($submit_label_single === $submit_label_recurring)
  ? $submit_label_single
  : $submit_label;

$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__controls',
]);

$status_id = wp_unique_id('fame-form-submit-status-');
$incomplete_status = __('The form has incomplete or invalid fields.', 'fame_lahjoitukset');
$ready_status = __('The form is ready to submit.', 'fame_lahjoitukset');

?>
<div <?php echo $wrapper_attrs; ?>>
  <p
    id="<?php echo esc_attr($status_id); ?>"
    class="fame-form__submit-status"
    data-incomplete-status="<?php echo esc_attr($incomplete_status); ?>"
    data-ready-status="<?php echo esc_attr($ready_status); ?>"><?php echo esc_html($incomplete_status); ?></p>

	<p class="fame-form__submission-error" role="alert" aria-atomic="true"></p>
	<p class="fame-form__validation-announcer screen-reader-text" aria-live="polite" aria-atomic="true"></p>

  <button
    type="submit"
    class="wp-element-button is-primary fame-form__submit--inactive"
    aria-disabled="true"
    aria-describedby="<?php echo esc_attr($status_id); ?>"
    data-label-single="<?php echo esc_attr($submit_label_single); ?>"
    data-label-recurring="<?php echo esc_attr($submit_label_recurring); ?>">
    <?php echo esc_html($resolved); ?>
  </button>

  <noscript>
    <?php echo esc_html__('Please enable JavaScript to use this form.', 'fame_lahjoitukset'); ?>
  </noscript>
</div>
