# Translations (i18n)

This plugin is translatable through WordPress's standard gettext
internationalization system. Strings come from both PHP and JavaScript/block
code, and all translation files live in the [`languages/`](../languages)
directory.

The text domain is **`fame_lahjoitukset`** . Every translatable
string in the code is wrapped in that domain, e.g.
`__('Settings', 'fame_lahjoitukset')` in PHP or
`__('Amount', 'fame_lahjoitukset')` in JS.

## How WordPress translations work

WordPress uses [GNU gettext](https://www.gnu.org/software/gettext/). There are
four file types, and each has a job:

| File    | Purpose                                                                                                                                                             | Edited by hand?                  |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| `.pot`  | **Template.** The list of every original (English) string extracted from the source code. Contains no translations.                                                 | No — generated from code.        |
| `.po`   | **Translation source** for one language. Human-readable, holds `msgid` (original) / `msgstr` (translation) pairs.                                                   | **Yes — this is what you edit.** |
| `.mo`   | **Compiled** binary version of a `.po`. This is what PHP actually reads at runtime.                                                                                 | No — compiled from `.po`.        |
| `.json` | **JS translations.** WordPress loads block/editor script strings from JSON, not `.mo`. One file per source script (the hash in the filename identifies the script). | No — generated from `.po`.       |

The flow is:

```
source code  ─→  .pot  ─→  .po (translate here)  ─→  .mo  (for PHP)
                                                └─→  .json (for JS)
```

### File naming in `languages/`

Files are named `fame_lahjoitukset-{locale}.*`. We ship one file set per locale,
using the **full** locale form:

- `fame_lahjoitukset-fi_FI.*` — Finnish
- `fame_lahjoitukset-sv_SE.*` — Swedish

### How the plugin loads them

Short locales are matched to full locale forms (`fi` -> `fi_FI`), so a
site set to either `fi` or `fi_FI` resolves to the shipped `fi_FI` files. The
logic lives in [`src/Blocks.php`](../src/Blocks.php).

- **PHP strings:** `loadTextdomain()` loads the `.mo` from `languages/`, trying
  the locale candidates in order.
- **JS / block strings:** `wp_set_script_translations()` points each block
  script at `languages/`.

## Build workflow

The npm scripts in [`package.json`](../package.json) wrap the
[WP-CLI `i18n`](https://developer.wordpress.org/cli/commands/i18n/) commands.

| Script               | What it does                                                                                                                                                              |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `npm run i18n:pot`   | Builds JS first, then extracts every translatable string from the code into `languages/fame_lahjoitukset.pot`. Run this after **adding or changing strings in the code**. |
| `npm run i18n:mo`    | Compiles each locale's `.po` into a runtime `.mo` (used by PHP).                                                                                                          |
| `npm run i18n:json`  | Generates the per-script `.json` files (used by JS/blocks) from each locale's `.po`.                                                                                      |
| `npm run build:i18n` | Runs `i18n:mo` + `i18n:json` — the compile step CI runs to produce the runtime files.                                                                                     |
| `npm run i18n`       | Runs pot + mo + json in order — the one-shot "rebuild everything" command.                                                                                                |

> **Heads up:** `npm run i18n` (and `i18n:pot`) regenerate the `.pot` from
> code, but they do **not** merge new strings into existing `.po` files. When
> you add brand-new strings, you must bring them into each `.po` (see below).

## Editing translations

1. Open the full-locale `.po` file for the language, e.g.
   [`languages/fame_lahjoitukset-fi_FI.po`](../languages/fame_lahjoitukset-fi_FI.po).
2. Find the string by its original English text in the `msgid` line, and edit
   the `msgstr` line below it. For example:

   ```po
   #: build/Blocks/donation-campaigns/block.json
   #: src/Blocks/donation-campaigns/block.json
   msgctxt "block description"
   msgid "Campaign selector for the donation form."
   msgstr "Kampanjavalitsin lahjoituslomakkeelle."
   ```

   Only change the text inside the `msgstr` quotes. Leave `msgid` and
   `msgctxt` untouched — those are the lookup keys.
3. Commit the changed `.po` file. That's all you commit — CI compiles the
   `.mo`/`.json` for the release zip.

   To preview the result locally before pushing, you can compile them yourself:
   `npm run build:i18n`.

## Adding a new translatable string

1. In the code, wrap the string in the text domain, e.g.
   `__('New label', 'fame_lahjoitukset')` (PHP) or the equivalent
   `@wordpress/i18n` call in JS.
2. Run `npm run i18n:pot` to extract it into the `.pot`.
3. Merge the new entry into each language `.po`. Either copy the new
   `msgid`/`msgstr` block from the `.pot` into `fame_lahjoitukset-fi_FI.po` and
   `fame_lahjoitukset-sv_SE.po` and fill in the `msgstr`, or use
   `msgmerge fame_lahjoitukset-fi_FI.po fame_lahjoitukset.pot` (from gettext) to
   merge automatically.
4. Commit the `.po`/`.pot` changes. CI builds the `.mo`/`.json` from them.

## Adding a new language

1. Copy `languages/fame_lahjoitukset.pot` to
   `languages/fame_lahjoitukset-{locale}.po` (e.g. `-en_US.po`).
2. Fill in the `.po` header (`Language:`, `Plural-Forms:`) and translate the
   `msgstr` entries.
3. Commit the new `.po`. The `i18n:mo`/`i18n:json` scripts compile every `.po`
   in `languages/`, so CI picks it up automatically. Use the full locale form
   (e.g. `en_US`); the runtime short/full fallback covers the rest.
