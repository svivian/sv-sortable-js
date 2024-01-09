/**
 * Tests that interact with the DOM must be run asynchronously to allow the DOM to update.
 * @param {QUnit.assert} assert - QUnit assert object
 * @param {Function} setupCallback - Function to run before the test.
 * @param {Function} assertCallback - Function to run after the test.
 */
function runAsyncTest(assert, setupCallback, assertCallback) {
	let done = assert.async();

	let promise = new Promise(function(resolve, reject) {
		setupCallback();

		setTimeout(function () {
			resolve();
		}, 250);
	});

	promise.then(function() {
		assertCallback();
		done();
	});
}

/**
 * Common function for sorting a table and testing its state.
 * @param {String} testName - Name of the test.
 * @param {Element} table - Table element to sort.
 * @param {Number} colIndex - Index of column to sort (1-indexed like nth-child).
 * @param {Array} expected - Expected values of the column after sorting.
 * @param {Number} numClicks - Number of times to click the column header.
 */
function testTableSort(testName, table, colIndex, expected, numClicks = 1) {
	QUnit.test(testName, function(assert) {
		let asyncSetup = function() {
			let intCol = table.querySelector(`thead > tr > th:nth-child(${colIndex})`);
			// space out multiple clicks to allow the DOM to update
			for (let i = 0; i < numClicks; i++) {
				setTimeout(() => intCol.click(), 20 * i)
			}
		};

		let runAsserts = function() {
			let colCells = table.querySelectorAll(`tbody > tr > td:nth-child(${colIndex})`);
			let colValues = Array.from(colCells).map((cell) => cell.innerText);
			assert.deepEqual(colValues, expected);
		};

		runAsyncTest(assert, asyncSetup, runAsserts);
	});
}


// convert string of the form "Mar 15, 1987" into a Date object.
const dateFromString = function(str) {
	const months = [
		"jan", "feb", "mar", "apr", "may", "jun",
		"jul", "aug", "sep", "oct", "nov", "dec",
	];

	str = str.trim();
	let pattern = /^([a-zA-Z]{3}) *(\d{1,2}), *(\d{4})$/;
	let regex = new RegExp(pattern);
	let dateParts = regex.exec(str);

	let year = dateParts[3];
	let month = months.indexOf(dateParts[1].toLowerCase());
	let day = dateParts[2];

	return new Date(year, month, day);
};

// blank strings are 'undefined' in sorting, so this moves them to the end
const moveBlanks = function(a, b) {
	if (a < b) {
		if (a == "")
			return 1;
		else
			return -1;
	}
	if (a > b) {
		if (b == "")
			return -1;
		else
			return 1;
	}
	return 0;
};


// set up tables

let basicTable = document.querySelector('#basic');
let basicSortable = new SV.Sortable(basicTable);
let colspanTable = document.querySelector('#colspan');
let colspanSortable = new SV.Sortable(colspanTable);

let complexTable = document.querySelector('#complex');
let complexSortable = new SV.Sortable(complexTable, {
	initialSort: 0,
	sortFns: {
		"date": function(a, b) {
			let aDate = dateFromString(a);
			let bDate = dateFromString(b);

			return aDate - bDate;
		},
		"moveBlanks": moveBlanks,
	}
});



// run tests

testTableSort('Basic integer sort', basicTable, 1, ['-53', '2', '15', '95', '195']);
testTableSort('Basic float sort', basicTable, 2, ['-858', '-152.5', '-.18', '36', '88.5']);
testTableSort('Basic string sort', basicTable, 3, ['apple', 'banana', 'coke', 'orange', 'zebra']);

testTableSort('Colspan sort', colspanTable, 2, ['X', 'Y', 'Z']);

QUnit.test('Complex initialSort option', function(assert) {
	let asyncSetup = function() {};

	let runAsserts = function() {
		let intCells = complexTable.querySelectorAll(`tbody > tr > td:nth-child(1)`);
		let intValues = Array.from(intCells).map((cell) => cell.innerText);
		assert.deepEqual(intValues, ['-53', '2', '15', '95', '195']);
	};

	runAsyncTest(assert, asyncSetup, runAsserts);
});

testTableSort('Complex descending sort', complexTable, 3, ['88.5', '36', '-.18', '-152.5', '-858']);
testTableSort('Complex blank sort', complexTable, 4, ['banana', 'hello', 'orange', '', '']);
testTableSort('Complex date sort', complexTable, 7, ['Mar 15, 1986', 'May 15, 1986', 'Sep 15, 2002', 'Aug 07, 2004', 'Feb 27, 2086']);
testTableSort('Complex custom value sort', complexTable, 8, ['E', 'T', 'A', 'O', 'I']);
testTableSort('Complex blank sort descending', complexTable, 4, ['', '', 'orange', 'hello', 'banana'], 2);
