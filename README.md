# angular-autocomplete
Autocomplete directive for Angular that supports configurable event handling and templates.

## Keypress handling
Autocomplete includes basic keypress handling, provided it has focus.

`Up Arrow`: hightlight previous item

`Down Arrow`: hightlight next item

`Enter/Tab`: select current item (this will trigger `on-selection-complete` callback with the value selected as the parameter)

`Esc`: dismiss without selecting (this will trigger `on-selection-complete` callback with a `null` parameter)
