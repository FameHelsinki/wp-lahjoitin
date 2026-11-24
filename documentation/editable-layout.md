# Editable donation layouts

Existing published forms keep their legacy spacing and 600px group width limit until opened and saved in the editor. The editor migrates older block trees once, retaining content and styled groups. Already migrated content is not rewritten on reopening, and newer layout versions are not downgraded. In new and migrated forms, section widths follow the columns and theme.

The form supports one to three columns. Increasing the count adds empty columns; decreasing it appends overflow to the last remaining column. Column changes support Undo and Redo. User-defined block locks are retained. Columns accept normal WordPress blocks and extension blocks; an allowed-block list is not stored per column. A runtime insertion rule rejects nested donation forms and built-in blocks that generate another form (search, login, comments form and form). PHP also rejects native forms rendered by custom HTML, shortcodes or third-party blocks.

Required sections are donation type, amounts, providers and submit controls. Removing one shows a warning and blocks saving until the section is restored. Invalid forms saved outside the editor render an unavailable notice instead of a broken payment form.

Optional campaign and recurring charge-day blocks are no longer silently reinserted into existing forms. They can be added from the block inserter. New forms include both by default.

Terms are an independent paragraph, placed before submit controls on new forms. Existing terms are moved out of the provider block without changing their contents. Empty terms placeholders are hidden on the public page.

Theme legend weights remain unchanged unless an explicit section-label weight is selected. Color controls offer theme palettes and custom colors. Clearing a color restores the same fallback in the editor and on the public page.
