
SV-Sortable
=================================================

**sv-sortable-js** is a vanilla JavaScript library for sorting a table. No dependencies, and it just sorts (if you want filtering as well, check out [SV-Filtable](https://github.com/svivian/sv-filtable-js)).


## Example usage

1. Start with standard table HTML, including the `<thead>` and `<tbody>` elements. Each column that you want to sort should have a table header with the `data-sort` attribute set to the data type (`string`, `int` or `float`).

	```html
	<table id="data">
	<thead>
		<tr>
			<th data-sort="string">First name</th>
			<th data-sort="string">Last name</th>
			<th data-sort="string">City</th>
			<th data-sort="int">Age</th>
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
	<script defer src="/path/to/sv-filtable.js"></script>
	```

3. Call `SV.Sortable` with an HTMLElement object for the table, and any custom options. As we are deferring script loading above, we must run this after page load:

	```html
	<script>
	// Run on page load
	document.addEventListener('DOMContentLoaded', function() {
		const table = document.querySelector('#data');
		let sortable = new SV.Sortable(table, {
			initialSort: 0,
		});
	});
	</script>
	```

Voila! Clicking on the table headers will now sort the table by that column.
