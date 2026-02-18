<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/donation-type
 *
 * @var array<string, mixed>|null $attributes Block attributes.
 * @var string|null              $content    Inner content (unused here).
 * @var WP_Block                 $block      Block instance.
 */

$attributes = $attributes ?? [];

$show_legend = array_key_exists('showLegend', $attributes) ? (bool) $attributes['showLegend'] : true;

$legend = (isset($attributes['legend']) && trim((string) $attributes['legend']) !== '')
  ? (string) $attributes['legend']
  : __('Donation type', 'fame_lahjoitukset');

$saved_types = (isset($attributes['types']) && is_array($attributes['types'])) ? $attributes['types'] : [];
$saved_value = isset($attributes['value']) ? (string) $attributes['value'] : '';

// Context: enabled donation types from parent (providesContext).
$enabled_types = [];
if (array_key_exists('famehelsinki/donation-types', $block->context)) {
  $raw = $block->context['famehelsinki/donation-types'];
  if (is_array($raw)) {
    $enabled_types = array_values(array_map('strval', $raw));
  }
}

// Types comes from attributes (saved) or context (enabled) or fallback (default).
$types = !empty($saved_types)
  ? $saved_types
  : [
    ['value' => 'single',    'label' => __('Single', 'fame_lahjoitukset')],
    ['value' => 'recurring', 'label' => __('Recurring', 'fame_lahjoitukset')],
  ];

$types = array_values(array_filter(
  $types,
  static fn($t) =>
  is_array($t) && isset($t['value']) && (string) $t['value'] !== ''
));

if (!empty($enabled_types)) {
  $types = array_values(array_filter(
    $types,
    static fn($t) => in_array((string) $t['value'], $enabled_types, true)
  ));
}

// Fallback
if (empty($types)) {
  $types = [
    ['value' => 'single', 'label' => __('Single', 'fame_lahjoitukset')],
  ];
}

$values = array_map(static fn($t) => (string) ($t['value'] ?? ''), $types);

$default_value =
  ($saved_value !== '' && in_array($saved_value, $values, true))
  ? $saved_value
  : (string) ($types[0]['value'] ?? '');

$is_hidden = count($types) <= 1;

$classes = $is_hidden
  ? 'fame-form__hidden'
  : 'fame-form__fieldset fame-form__fieldset--donation-type';

$wrapper_attrs = get_block_wrapper_attributes(['class' => $classes]);

?>

<?php if ($is_hidden) :
  $val = (string) ($types[0]['value'] ?? $default_value);
?>
  <div <?php echo $wrapper_attrs; ?>>
    <input type="hidden" name="type" value="<?php echo esc_attr($val); ?>" />
  </div>
<?php else : ?>
  <fieldset <?php echo $wrapper_attrs; ?>>
    <legend class="fame-form__legend<?php echo $show_legend ? '' : ' screen-reader-text'; ?>">
      <?php echo esc_html($legend); ?>
    </legend>

    <?php foreach ($types as $t) :
      $value = (string) ($t['value'] ?? '');
      $label = (string) (($t['label'] ?? '') !== '' ? $t['label'] : $value);
      $id    = 'donation-type-' . sanitize_title($value);
    ?>
      <div class="fame-form__group">
        <label for="<?php echo esc_attr($id); ?>" class="fame-form__label">
          <input
            id="<?php echo esc_attr($id); ?>"
            class="fame-form__check-input"
            type="radio"
            name="type"
            value="<?php echo esc_attr($value); ?>"
            <?php checked($value, $default_value); ?> />
          <?php echo esc_html($label); ?>
        </label>
      </div>
    <?php endforeach; ?>
  </fieldset>
<?php endif; ?>