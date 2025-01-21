/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * Imports the InspectorControls component, which is used to wrap
 * the block's custom controls that will appear in in the Settings
 * Sidebar when the block is selected.
 *
 * Also imports the React hook that is used to mark the block wrapper
 * element. It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#inspectorcontrols
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';

/**
 * Imports the necessary components that will be used to create
 * the user interface for the block's settings.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/
 */
import { PanelBody, TextControl, ToggleControl, SelectControl, CheckboxControl, TextareaControl } from '@wordpress/components';

/**
 * Imports the useEffect React Hook. This is used to set an attribute when the
 * block is loaded in the Editor.
 *
 * @see https://react.dev/reference/react/useEffect
 */
import { useState, useEffect } from 'react';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
*/
export default function Edit( { attributes, setAttributes } )
{
    const provider_options = [{
        value: 'mobilepay',
        label: 'MobilePay',
    }, {
        value: 'paymenthighway',
        label: 'PaymentHighway',
    }, {
        value: 'checkout',
        label: 'Checkout',
    }];

    const { fallbackCurrentYear, showStartingYear, startingYear, singleDonation, recurringDonation } = attributes;

    // Get the current year and make sure it's a string.
    const currentYear = new Date().getFullYear().toString();

    // When the block loads, set the fallbackCurrentYear attribute to the
    // current year if it's not already set.
    useEffect(() => {
        if ( currentYear !== fallbackCurrentYear ) {
            setAttributes({ fallbackCurrentYear: currentYear });
        }
    }, [ currentYear, fallbackCurrentYear, setAttributes ]);

    let displayDate;

        // Display the starting year as well if supplied by the user.
    if ( showStartingYear && startingYear ) {
        displayDate = startingYear + '–' + currentYear;
    } else {
        displayDate = currentYear;
    }

    const [ providers, setProviders ] = useState([]);

    return (
        <>
            <InspectorControls>
                <PanelBody title={ __('Settings', 'k') }>
                    <CheckboxControl
                        label={__("Single donations", 'fame_lahjoitukset')}
                        help={__("Enable single donations", 'fame_lahjoitukset')}
                        checked={ singleDonation }
                        onChange={ () =>
                            setAttributes({
                                singleDonation: !singleDonation,
                            })
                        }
                    />
                    {singleDonation && <>
                        <SelectControl
                            label={__("Single donation provider", 'fame_lahjoitukset')}
                            value={ providers }
                            onChange={ setProviders }
                            options={ provider_options }
                        />
                        <TextareaControl
                            label={__("Predefined amounts", 'fame_lahjoitukset')}
                            help={__("Add pre-set amounts separated by newline", 'fame_lahjoitukset')}
                            value={ "" }
                        />
                        <ToggleControl
                            checked={ showStartingYear }
                            label={ __(
                                'Include other amount',
                                'fame_lahjoitukset'
                            ) }
                            onChange={ () =>
                                setAttributes({
                                    showStartingYear: ! showStartingYear,
                                })
                            }
                        />
                    </>}
                    <CheckboxControl
                        label={__("Recurring donations", 'fame_lahjoitukset')}
                        help={__("Enable recurring donations", 'fame_lahjoitukset')}
                        checked={ recurringDonation }
                        onChange={ () =>
                            setAttributes({
                                recurringDonation: !recurringDonation,
                            })
                        }
                    />
                    {recurringDonation && <>
                        <SelectControl
                            label={__("Recurring donation provider", 'fame_lahjoitukset')}
                            value={ providers }
                            onChange={ setProviders }
                            options={ provider_options }
                        />
                        <TextareaControl
                            label={__("Predefined amounts", 'fame_lahjoitukset')}
                            help={__("Add pre-set amounts separated by newline", 'fame_lahjoitukset')}
                            value={ "" }
                        />
                        <ToggleControl
                            checked={ showStartingYear }
                            label={ __(
                                'Include other amount',
                                'fame_lahjoitukset'
                            ) }
                            onChange={ () =>
                                setAttributes({
                                    showStartingYear: ! showStartingYear,
                                })
                            }
                        />
                    </>}
                    <ToggleControl
                        checked={ showStartingYear }
                        label={ __(
                            'Include contact form',
                            'fame_lahjoitukset'
                        ) }
                        onChange={ () =>
                            setAttributes({
                                showStartingYear: ! showStartingYear,
                            })
                        }
                    />
                    <ToggleControl
                        checked={ showStartingYear }
                        label={ __(
                            'Include address',
                            'fame_lahjoitukset'
                        ) }
                        onChange={ () =>
                            setAttributes({
                                showStartingYear: ! showStartingYear,
                            })
                        }
                    />
                    <ToggleControl
                        checked={ showStartingYear }
                        label={ __(
                            'Include phone number',
                            'fame_lahjoitukset'
                        ) }
                        onChange={ () =>
                            setAttributes({
                                showStartingYear: ! showStartingYear,
                            })
                        }
                    />
                    { showStartingYear && (
                        <TextControl
                            label={ __(
                                'Starting year',
                                'fame_lahjoitukset'
                            ) }
                            value={ startingYear }
                            onChange={ ( value ) =>
                                setAttributes({ startingYear: value })
                            }
                        />
                    ) }
                </PanelBody>
            </InspectorControls>
            <p { ...useBlockProps() }>© { displayDate }</p>
        </>
    );
}
