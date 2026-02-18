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

$showLegend  = array_key_exists('showLegend', $attributes) ? (bool) $attributes['showLegend'] : true;
$legend      = isset($attributes['legend']) && trim((string) $attributes['legend']) !== ''
  ? (string) $attributes['legend']
  : __('Contacts', 'fame_lahjoitukset');

$contact     = array_key_exists('contact', $attributes) ? (bool) $attributes['contact'] : false;
$showAddress = array_key_exists('showAddress', $attributes) ? (bool) $attributes['showAddress'] : true;
$showPhone   = array_key_exists('showPhone', $attributes) ? (bool) $attributes['showPhone'] : true;

$wrapper_attrs = get_block_wrapper_attributes([
  'class' => 'fame-form__fieldset',
]);

$get = static function (array $attrs, string $key, string $fallback = ''): string {
  return isset($attrs[$key]) ? (string) $attrs[$key] : $fallback;
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
      <?php echo wp_kses_post($label); ?>
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
        <?php echo wp_kses_post($help); ?>
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
        <?php echo wp_kses_post($help); ?>
      </small>
    <?php endif; ?>
  </div>
<?php
};

?>
<fieldset <?php echo $wrapper_attrs; ?><?php echo $contact ? ' data-contact="1"' : ''; ?>>
  <?php if ($showLegend) : ?>
    <legend class="fame-form__legend"><?php echo wp_kses_post($legend); ?></legend>
  <?php endif; ?>

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