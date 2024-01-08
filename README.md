
SV-Sortable
=================================================

**sv-sortable-js** is a vanilla JavaScript library for sorting a table. No dependencies, and it just sorts. There are functions for manually sorting, plus custom events that can be hooked into.

If you want table filtering as well, check out [SV-Filtable](https://github.com/svivian/sv-filtable-js). Both libraries are independent but work nicely in tandem.


## Installation

Sortable can be installed via npm:

```sh
npm install sv-sortable
```

Then use the file `node_modules/sv-sortable/src/sv-sortable.js` in your project - either directly in a `<script>` tag, or passing into your bundler/task runner.

Alternatively, you can download the latest release from GitHub and use the file `src/sv-sortable.js`.


## Example usage

1. Start with standard table HTML, including the `<thead>` and `<tbody>` elements. Each column that you want to sort should have a table header with the `data-sort-type` attribute set to the data type:

	```html
	<table id="data">
	<thead>
		<tr>
			<th data-sort-type="string">First name</th>
			<th data-sort-type="string">Last name</th>
			<th data-sort-type="string">City</th>
			<th data-sort-type="int">Age</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Homer</td>
			<td>Simpson</td>
			<td>Springfield</td>
			<td>36</td>
		</tr>
		<!-- ...and so on -->
	</tbody>
	</table>
	```

2. Include the Sortable script in your page's `<head>`. For performance reasons we are using the `defer` attribute:

	```html
	<script defer src="/path/to/sv-sortable.js"></script>
	```

3. Call `SV.Sortable` with an HTMLElement object for the table (such as that returned from `document.querySelector`), and any custom options. As we are deferring script loading above, we must run this after page load:

	```html
	<script>
	// Run on page load
	document.addEventListener('DOMContentLoaded', function() {
		// get the table element
		const table = document.querySelector('#data');
		// create a new Sortable object
		let sortable = new SV.Sortable(table, {
			initialSort: 0
		});
	});
	</script>
	```

Voila! Clicking on the table headers will now sort the table by that column.


## Configuration

Sortable has several means of controlling the sorting, using data attributes:

### `data-sort-type`

Used on headers (`<th>` elements) to specify the data type of the column. Sortable comes with four built-in types:

- `int` - for integers
- `float` - for decimal numbers
- `string` - for case-sensitive strings
- `string-ins` - for case-insensitive strings

Custom types can be added using the `sortFns` option (see below).

### `data-sort-default`

Used on headers (`<th>` elements) to specify which sorting direction to use first. By default Sortable sorts columns in ascending order, but by setting `data-sort-default="desc"` on a header, the first click of that header will sort the column in descending order.

### `data-sort-value`

Used on individual table cells (`<td>` elements) to specify the value to sort by. This is useful when you want to show a human-readable format like a date, but sort by a computer-friendly format like a timestamp. In the example below, April would be sorted before January when using string comparison, but the `data-sort-value` attribute ensures the correct order is used:

```html
<tr>
	<td data-sort-value="2020-04-01">April 1, 2020</td>
</tr>
<tr>
	<td data-sort-value="2020-01-01">January 1, 2020</td>
</tr>
```

Sortable also has two options that can be passed to the constructor:

### `initialSort`

This sets the table to automatically sort by a particular column when loaded. Columns are zero-indexed, so the first is `0`, the second is `1`, and so on. The default is `false`, which means no initial sort.

### `sortFns`

An object containing custom functions for sorting data. The keys should be an ID for the data type, which will match the value of the `data-sort-type` attribute on the table header. The values should be callback functions appropriate for passing into the native JavaScript `Array.sort()`. These functions should take two arguments, `a` and `b`, and return a negative number, zero, or a positive number if `a` is less than, equal to, or greater than `b`, respectively.

For example if we are showing full names in a column, but want to sort by surname, we could use the following:

```js
let customSortFns = {
	'surname': function(a, b) {
		// split into an array of words and get the last element
		let aLast = a.split(' ').pop();
		let bLast = b.split(' ').pop();

		return aLast.localeCompare(bLast);
	}
};

new SV.Sortable(table, {
	sortFns: customSortFns
});
```

Then we would use `data-sort-type="surname"` on the table header.


## Methods

Sortable has one public property and two public methods that can be called on the object returned from the constructor:

### `.dir`

An enum-like property containing the strings for the sorting directions, 'asc' and 'desc'. It's recommended to use this instead of hard-coding the strings in your code.

### `.sortColumn(index, sortDir)`

A function to manually sort a column in the given direction. Columns are 0-indexed, and the direction is optional (defaulting to ascending). As above, use the `dir` property for sorting direction. Example:

```js
const table = document.querySelector('#data');
let sortable = new SV.Sortable(table);
// sort the third column downwards
sortable.sortColumn(2, sortable.dir.desc);
```

### `.getThByIndex(index)`

A function to get a specific table header, taking colspans into account.


## Events

Sortable supports two custom events: `sv.sortable.before` and `sv.sortable.after`, which are called respectively (can you guess?) *before* the table sorting begins and *after* sorting is finished. This allows you to, for example, display a message like "Processing..." while the sorting is running (if using a very large table where a delay might be noticeable). The events are triggered on the table element itself.

```js
const table = document.querySelector('#data');
let sortable = new SV.Sortable(table);

table.addEventListener('sv.sortable.before', function(ev) {
	// show a message
	// or do something with the properties: ev.detail.th, ev.detail.column, ev.detail.dir
});
table.addEventListener('sv.sortable.after', function(ev) {
	// hide the message
});
```

The event object passed to the callback function has a `detail` property, which contains the following sub-properties:

- `th` - a reference to the table header that was clicked
- `column` - the index of the column being sorted
- `dir` - the direction of the sort, matching the `sortable.dir` enum
