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
 * @param {Array} checkStateCallback - Function to run after the sort to check the state of the table, which takes the table, colIndex, and assert object as arguments.
 * @param {Number} numClicks - Number of times to click the column header.
 */
function testTableSort(testName, table, colIndex, checkStateCallback, numClicks = 1) {
	QUnit.test(testName, function(assert) {
		let asyncSetup = function() {
			// no clicks (e.g. testing initial state)
			if (colIndex === null)
				return;

			let intCol = table.querySelector(`thead > tr > th:nth-child(${colIndex})`);
			// space out multiple clicks to allow the DOM to update
			for (let i = 0; i < numClicks; i++) {
				setTimeout(() => intCol.click(), 20 * i)
			}
		};

		let runAsserts = function() {
			checkStateCallback(table, colIndex, assert);
		};

		runAsyncTest(assert, asyncSetup, runAsserts);
	});
}


// Creates a function to be passed into testTableSort that checks the values of a column match expectation.
const createCheckColumnValuesCallback = function(expected) {
	return function(table, colIndex, assert) {
		let colCells = table.querySelectorAll(`tbody > tr > td:nth-child(${colIndex})`);
		let colValues = Array.from(colCells).map((cell) => cell.innerText);
		assert.deepEqual(colValues, expected);
	};
};

// Creates a function to be passed into testTableSort, that checks the classes of the header match expectation.
const createCheckHeaderClassCallback = function(expectedClass, unexpectedClass) {
	return function(table, colIndex, assert) {
		let header = table.querySelector(`thead > tr > th:nth-child(${colIndex})`);
		assert.ok(header.classList.contains(expectedClass));
		assert.notOk(header.classList.contains(unexpectedClass));
	};
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

testTableSort('Basic integer sort', basicTable, 1, createCheckColumnValuesCallback(['-53', '2', '15', '95', '195']));
testTableSort('Basic float sort', basicTable, 2, createCheckColumnValuesCallback(['-858', '-152.5', '-.18', '36', '88.5']));
testTableSort('Basic string sort', basicTable, 3, createCheckColumnValuesCallback(['apple', 'banana', 'coke', 'orange', 'zebra']));

testTableSort('Colspan sort', colspanTable, 2, createCheckColumnValuesCallback(['X', 'Y', 'Z']));

testTableSort('Complex initialSort option', complexTable, null, function(table, colIndex, assert) {
	let intCells = table.querySelectorAll(`tbody > tr > td:nth-child(1)`);
	let intValues = Array.from(intCells).map((cell) => cell.innerText);
	assert.deepEqual(intValues, ['-53', '2', '15', '95', '195']);
});

testTableSort(
	'Complex descending sort', complexTable, 3,
	createCheckColumnValuesCallback(['88.5', '36', '-.18', '-152.5', '-858'])
);
testTableSort(
	'Complex blank sort', complexTable, 4,
	createCheckColumnValuesCallback(['banana', 'hello', 'orange', '', ''])
);
testTableSort(
	'Complex date sort', complexTable, 7,
	createCheckColumnValuesCallback(['Mar 15, 1986', 'May 15, 1986', 'Sep 15, 2002', 'Aug 07, 2004', 'Feb 27, 2086'])
);
testTableSort(
	'Complex custom value sort', complexTable, 8,
	createCheckColumnValuesCallback(['E', 'T', 'A', 'O', 'I'])
);
testTableSort(
	'Complex blank sort descending', complexTable, 4,
	createCheckColumnValuesCallback(['', '', 'orange', 'hello', 'banana']),
	2
);

testTableSort('Correct header classes descending', basicTable, 1, createCheckHeaderClassCallback('sorting-desc', 'sorting-asc'), 2);
testTableSort('Correct header classes ascending', basicTable, 1, createCheckHeaderClassCallback('sorting-asc', 'sorting-desc'));
