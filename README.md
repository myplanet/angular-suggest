# angular-autocomplete
Autocomplete directive for Angular that supports configurable event handling and templates.

## Usage example:
```html
<autocomplete ng-model="data" query-suggestions="autocompleteQuery" on-selection-complete="onSelectionComplete"></autocomplete>
```

## Attribtues
`ng-model`: *(required)* The data model that autocomplete will be using to fetch suggestions. Idealy tied to the model of an input field.

`query-suggestions`: *(required)* A callback function that takes one argument as the input value and produces a list of autocomplete suggestions. Autocomplete will call this function with its model when the model changes.

`on-selection-complete`: *(optional)* A callback function that gets invoked once interaction of the autocomplete widget is completed, either by selecting a value or dismissed by key press. If a value is selected this function will receive the value as a parameter, otherwise it will receive `null`. This is a good place to handle focus event, be it restoring focus on the original input element for further input, or passing along to the next input element in the form.
