// load namespace
SV = window.SV || {};

SV.Sortable = (function() {

	// constructor
	return function(tableElem, userConfig) {

		// private members

		const defaultOptions = {
			initialSort: false,

			sortFns: {
				'int': function(a, b) {
					return parseInt(a, 10) - parseInt(b, 10);
				},
				'float': function(a, b) {
					return parseFloat(a) - parseFloat(b);
				},
				'string': function(a, b) {
					return a.toString().localeCompare(b.toString());
				},
				'string-ins': function(a, b) {
					a = a.toString().toLocaleLowerCase();
					b = b.toString().toLocaleLowerCase();
					return a.localeCompare(b);
				},
			},
		};
		let config = {};

		// enum for sorting direction
		const dir = {asc: 'asc', desc: 'desc'};

		// public api
		let methods = {dir: dir};

		// private methods

		/**
		 * Override default options with user config.
		 * @param {Object} defaults - Default options.
		 * @param {Object} params - User config.
		 * @returns {Object} - Merged config.
		 */
		const extend = function(defaults, params) {
			let newConfig = Object.assign({}, defaults, params);
			if (params && params.sortFns)
				newConfig.sortFns = Object.assign({}, defaults.sortFns, params.sortFns);

			return newConfig;
		};

		/**
		 * Get index (0-based) of table header cell, taking into account any colspans.
		 * @param {Element} element - Table header cell.
		 * @returns {Number} - Index of cell.
		 */
		const getThIndex = function(element) {
			let index = 0;

			for (let th of element.parentElement.children) {
				if (th === element)
					return index;

				let colspan = th.getAttribute('colspan') || 1;
				index += parseInt(colspan, 10);
			}

			throw 'Header cell not found in table';
		}

		/**
		 * Get the direction in which we should sort this column. Defaults to ascending, unless otherwise specified or it's already sorted.
		 * @param {Element} thElem - Table header cell.
		 * @returns {String} - Sorting direction.
		 */
		const getNewSortDirection = function(thElem) {
			let currSortDir = thElem.getAttribute('data-sort-dir');

			if (currSortDir) {
				return currSortDir === dir.asc ? dir.desc : dir.asc;
			}

			return thElem.getAttribute('data-sort-default') || dir.asc;
		}

		/**
		 * Execute the actual sorting.
		 * @param {Array} allRows - Array of table rows.
		 * @param {Number} thIndex - Index of column to sort on.
		 * @param {Function} sortCompareFn - Sorting function for cell values.
		 * @returns {Array} - Array of sorted rows.
		 */
		const sortData = function(allRows, thIndex, sortCompareFn) {
			let column = [];

			// extract sort values from appropriate column and store in array with the row itself
			for (let row of allRows) {
				let td = row.children[thIndex];
				if (!td)
					continue;

				let sortValue = td.getAttribute('data-sort-value');
				if (sortValue === null) {
					sortValue = td.textContent;
				}

				column.push([sortValue, row]);
			}

			// now sort the column
			column.sort(function(a, b) {
				return sortCompareFn(a[0], b[0]);
			});

			// remap rows based on new ordering
			return column.map(function(row) {
				return row[1];
			});
		};

		/**
		 * Sort the table and trigger appropriate events.
		 * @param {Element} thElem - Table header cell.
		 * @param {String} sortDir - Sorting direction.
		 * @returns {void}
		 */
		const sortTable = function(thElem, sortDir) {

			let dataType = thElem.getAttribute('data-sort-type');
			if (!dataType)
				return;

			let thIndex = getThIndex(thElem);
			let sortCompareFn = config.sortFns[dataType] || config.sortFns['string'];

			// use manually specified sort direction if supplied, otherwise determine it based on current state
			const newSortDir = sortDir || getNewSortDirection(thElem);

			// trigger before-sort event
			const evDetail = {
				th: thElem,
				column: thIndex,
				dir: newSortDir,
			};
			tableElem.dispatchEvent(new CustomEvent('sv.sortable.before', {detail: evDetail}));

			// trigger a redraw to avoid locking up the browser and ensure sv.sortable.before takes effect
			setTimeout(function() {
				let allRows = tableElem.querySelectorAll(':scope > tbody > tr');

				let sortedRows = sortData(allRows, thIndex, sortCompareFn);
				if (newSortDir === dir.desc)
					sortedRows.reverse();

				// replace rows in table - surprisingly this is faster than using documentFragment
				let tbody = tableElem.querySelector('tbody');
				tbody.innerHTML = '';
				for (let trElem of sortedRows) {
					tbody.appendChild(trElem);
				}

				// set appropriate class and data on table headers
				let allHeaders = tableElem.querySelectorAll('thead th');
				for (let otherTh of allHeaders) {
					if (otherTh === thElem) {
						thElem.setAttribute('data-sort-dir', newSortDir);
						thElem.classList.add('sorting-' + newSortDir);
					} else {
						otherTh.removeAttribute('data-sort-dir');
						otherTh.classList.remove('sorting-asc', 'sorting-desc');
					}
				}

				// trigger after-sort event
				tableElem.dispatchEvent(new CustomEvent('sv.sortable.after', {detail: evDetail}));
			}, 10);
		};

		/**
		 * Set up the table for sorting, optionally perform initial sort.
		 * @returns {void}
		 */
		const init = function() {
			if (!tableElem)
				throw 'Error: invalid table element supplied';

			config = extend(defaultOptions, userConfig);

			tableElem.addEventListener('click', function(ev) {
				let thElem = ev.target.closest('th');
				if (!thElem)
					return;

				sortTable(thElem);
			});

			// handle initial sorting
			if (config.initialSort !== false)
				methods.sortColumn(config.initialSort);
		};

		// public methods

		/**
		 * Manually sort a column.
		 * @param {Number} index - Column to sort (0-indexed).
		 * @param {String} sortDir - Optional sorting direction ('asc' or 'desc').
		 * @returns {void}
		 */
		methods.sortColumn = function(index, sortDir) {
			let thElem = methods.getThByIndex(index);
			if (!thElem)
				return;

			sortTable(thElem, sortDir);
		};

		/**
		 * Get cell at index, taking colspans into account.
		 * @param {Number} index - Column to fetch (0-indexed).
		 * @returns {Element|null} - Table header cell.
		 */
		methods.getThByIndex = function(index) {
			let allHeaders = Array.from(tableElem.querySelectorAll(':scope > thead > tr > th'));
			let cellIndex = 0;
			for (let i = 0; i < allHeaders.length; i++) {
				let th = allHeaders[i];
				if (cellIndex >= index)
					return th;

				let colspan = th.getAttribute('colspan') || 1;
				cellIndex += parseInt(colspan, 10);
			}

			return null;
		};


		init();

		return methods;
	};

})();
