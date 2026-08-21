<?php

declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * render.php for famehelsinki/contact-form
 *
 * @param array    $attributes
 * @param string   $content
 * @param WP_Block $block
 */

/** @var array<string, mixed>|null $attributes */
$attributes = $attributes ?? [];

$show = array_key_exists('show', $attributes) ? (bool) $attributes['show'] : true;
if (!$show) {
  return;
}

$showLegend  = array_key_exists('showLegend', $attributes) ? (bool) $attributes['showLegend'] : true;
$legend_raw  = trim((string) ($attributes['legend'] ?? ''));
$legend      = $legend_raw === '' || $legend_raw === 'Contacts'
  ? __('Contacts', 'fame_lahjoitukset')
  : $legend_raw;

$contact     = array_key_exists('contact', $attributes) ? (bool) $attributes['contact'] : false;
$showAddress = array_key_exists('showAddress', $attributes) ? (bool) $attributes['showAddress'] : true;
$showPhone   = array_key_exists('showPhone', $attributes) ? (bool) $attributes['showPhone'] : true;

$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__fieldset',
]);

$localized_defaults = [
  'first_name_label' => ['First name', __('First name', 'fame_lahjoitukset')],
  'last_name_label' => ['Last name', __('Last name', 'fame_lahjoitukset')],
  'email_label' => ['Email', __('Email', 'fame_lahjoitukset')],
  'address_label' => ['Address', __('Address', 'fame_lahjoitukset')],
  'city_label' => ['City', __('City', 'fame_lahjoitukset')],
  'postal_code_label' => ['Postal code', __('Postal code', 'fame_lahjoitukset')],
  'phone_label' => ['Phone', __('Phone', 'fame_lahjoitukset')],
  'city_postal_code_help' => ['City', __('City', 'fame_lahjoitukset')],
];

$get = static function (array $attrs, string $key, string $fallback = '') use ($localized_defaults): string {
  $value = isset($attrs[$key]) ? trim((string) $attrs[$key]) : '';
  if (isset($localized_defaults[$key])) {
    [$legacy, $translated] = $localized_defaults[$key];
    return $value === '' || $value === $legacy ? $translated : $value;
  }
  return $value !== '' ? $value : $fallback;
};

$render_input = static function (
  array $attrs,
  string $name,
  string $type,
  bool $required = false,
  ?string $ariaDescribedBy = null
) use ($get): void {
  $label = $get($attrs, "{$name}_label", '');
  $help  = $get($attrs, "{$name}_help", '');

  $aria_id = $ariaDescribedBy ?: ($help !== '' ? "contact-{$name}-help" : '');
?>
  <div class="<?php echo esc_attr('fame-form__group' . ($required ? ' fame-form__group--required' : '')); ?>">
    <label for="<?php echo esc_attr("contact-{$name}"); ?>" class="fame-form__label">
      <?php echo esc_html($label); ?>
    </label>

    <input
      type="<?php echo esc_attr($type); ?>"
      name="<?php echo esc_attr($name); ?>" <?php echo $required ? ' required' : ''; ?>
      class="fame-form__input"
      id="<?php echo esc_attr("contact-{$name}"); ?>"
      <?php if ($aria_id !== '') : ?>
      aria-describedby="<?php echo esc_attr($aria_id); ?>"
      <?php endif; ?> />

    <?php if (!$ariaDescribedBy && $help !== '') : ?>
      <small id="<?php echo esc_attr("contact-{$name}-help"); ?>" class="fame-form__help">
        <?php echo esc_html($help); ?>
      </small>
    <?php endif; ?>
  </div>
<?php
};

$render_group = static function (array $attrs, string $groupName, array $controls) use ($render_input, $get): void {
  $help    = $get($attrs, "{$groupName}_help", '');
  $help_id = "contact-{$groupName}-help";
?>
  <div class="fame-form__row">
    <?php foreach ($controls as $c) :
      $n = (string) ($c['name'] ?? '');
      $t = (string) ($c['type'] ?? 'text');
      $r = !empty($c['required']);
      if ($n === '') continue;

      $render_input($attrs, $n, $t, $r, $help_id);
    endforeach; ?>

    <?php if ($help !== '') : ?>
      <small id="<?php echo esc_attr($help_id); ?>" class="fame-form__help">
        <?php echo esc_html($help); ?>
      </small>
    <?php endif; ?>
  </div>
<?php
};

?>
<fieldset <?php echo $wrapper_attrs; ?><?php echo $contact ? ' data-contact="1"' : ''; ?>>
  <?php
  $legend_align_raw = isset($attributes['legendAlign']) ? (string) $attributes['legendAlign'] : 'left';
  $legend_align     = in_array($legend_align_raw, ['left', 'center', 'right', 'justify'], true)
    ? $legend_align_raw
    : 'left';

  $legend_classes = ['fame-form__legend'];

  if (!$showLegend) {
    $legend_classes[] = 'screen-reader-text';
  }

  $legend_classes[] = 'has-text-align-' . $legend_align;
  ?>
  <legend class="<?php echo esc_attr(implode(' ', $legend_classes)); ?>">
    <?php echo esc_html($legend); ?>
  </legend>

  <?php
  $render_group($attributes, 'name', [
    ['name' => 'first_name', 'type' => 'text', 'required' => $contact],
    ['name' => 'last_name',  'type' => 'text', 'required' => $contact],
  ]);

  $render_input($attributes, 'email', 'email', $contact, null);

  if ($showAddress) {
    $render_input($attributes, 'address', 'text', false, null);

    $render_group($attributes, 'city_postal_code', [
      ['name' => 'city',        'type' => 'text', 'required' => false],
      ['name' => 'postal_code', 'type' => 'text', 'required' => false],
    ]);
  }

  if ($showPhone) {
    $render_input($attributes, 'phone', 'tel', false, null);
  }
  ?>
</fieldset>
