<?php

declare(strict_types=1);

use Fame\WordPress\Lahjoitukset\FormContent;

defined('ABSPATH') || exit;

$key = FormContent::additionalFieldKey($attributes['fieldKey'] ?? '');
$label = trim($attributes['label'] ?? '');
if ($key === '' || $label === '') {
    return;
}

$type = $attributes['fieldType'] ?? 'text';
$help = trim($attributes['helpText'] ?? '');
$required = $attributes['required'] ?? false;
$choices = [];
if ($type === 'select') {
    foreach ($attributes['choices'] ?? [] as $choice) {
        $name = is_array($choice) && is_string($choice['label'] ?? null) ? trim($choice['label']) : '';
        $value = is_array($choice) && is_string($choice['value'] ?? null) ? trim($choice['value']) : '';
        if ($name !== '') {
            $choices[$value === '' ? $name : $value] = $name;
        }
    }
    if (!$choices) {
        return;
    }
}

$id = wp_unique_id('lahjoitin-additional-field-');
$controlAttrs = sprintf('id="%s" name="custom_data[%s]" aria-invalid="false"', esc_attr($id), esc_attr($key));
if ($required) {
    $controlAttrs .= ' required';
}
if ($help !== '') {
    $controlAttrs .= sprintf(' aria-describedby="%s-help"', esc_attr($id));
}
$wrapperAttrs = get_block_wrapper_attributes([
    'class' => 'fame-form__group' . ($required ? ' fame-form__group--required' : ''),
]);
?>
<div <?php echo $wrapperAttrs; ?> data-custom-data-field="<?php echo esc_attr($key); ?>">
    <?php if ($type === 'checkbox') : ?>
        <div class="fame-form__custom-checkbox">
            <input type="checkbox" <?php echo $controlAttrs; ?> />
            <label for="<?php echo esc_attr($id); ?>" class="fame-form__label"><?php echo esc_html($label); ?></label>
        </div>
    <?php else : ?>
        <label for="<?php echo esc_attr($id); ?>" class="fame-form__label"><?php echo esc_html($label); ?></label>
        <?php if ($type === 'select') : ?>
            <select class="fame-form__input" <?php echo $controlAttrs; ?>>
                <option value=""><?php echo esc_html__('Select an option', 'fame_lahjoitukset'); ?></option>
                <?php foreach ($choices as $value => $name) : ?>
                    <option value="<?php echo esc_attr((string) $value); ?>"><?php echo esc_html($name); ?></option>
                <?php endforeach; ?>
            </select>
        <?php else : ?>
            <input type="text" class="fame-form__input" <?php echo $controlAttrs; ?>
                <?php if ($required) : ?>pattern=".*\S.*"<?php endif; ?> />
        <?php endif; ?>
    <?php endif; ?>
    <?php if ($help !== '') : ?>
        <small id="<?php echo esc_attr($id); ?>-help" class="fame-form__help"><?php echo esc_html($help); ?></small>
    <?php endif; ?>
</div>
