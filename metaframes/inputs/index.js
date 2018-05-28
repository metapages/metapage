/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:true});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;

function rename(prev, next) {
	if (!metaframe.getInput(prev)) {
		return;
	}
	var previousDiv = inputElements[prev].row;
	var rowBlob = createRow(next, previousDiv)
	rowBlob.update(metaframe.getInput(prev));
	inputElements[prev].deleteRow();
	delete inputElements[prev];
	inputElements[next] = rowBlob;
	metaframe.setInput(next, metaframe.getInput(prev));
}

//Creates javascript object with methods
function createRow(name, previousDiv) {
	var nameRow = document.createElement("td");
	var nameDiv = document.createElement("div");
	nameRow.appendChild(nameDiv);
	nameDiv.classList.add("box-name");
	nameDiv.innerHTML = name;
	nameDiv.setAttribute("contenteditable", true);
	var nameTimer;
	nameDiv.addEventListener("input", function(anything) {
		console.log('input');
		//Clear the current countdown
		if (nameTimer) {
			clearTimeout(nameTimer);
			nameTimer = null;
		}
		//Start a 1 second countdown, save the
		//changed name afterwards
		nameTimer = setTimeout(function() {
			console.log(`Save name=${nameDiv.innerHTML}`);
			if (name != nameDiv.innerHTML) {
				rename(name, nameDiv.innerHTML);
			}
		}, 1000);
	}, false);

	contenteditable="true"
	var valueRow = document.createElement("td");
	var valueDiv = document.createElement("div");
	valueRow.appendChild(valueDiv);
	valueDiv.classList.add('box-value');
	valueDiv.setAttribute("contenteditable", true);
	valueDiv.addEventListener("input", function(anything) {
		console.log('input');
		console.log(anything);
	}, false);

	// var sourceDiv = document.createElement("td");
	// sourceDiv.classList.add("box-source");

	// var typeDiv = document.createElement("td");
	// typeDiv.classList.add("box-type");

	var deleteDiv = document.createElement("td");
	deleteDiv.classList.add('box-delete');
	var deleteButton = document.createElement("button")
	deleteDiv.appendChild(deleteButton);
	deleteButton.classList.add('button', 'is-danger', 'is-small');

	function deleteRow() {
		metaframe.deleteInputs(name);
	}

	deleteButton.onclick = deleteRow;

	// typeDiv.classList.add("box-type");

	var rowDiv = document.createElement("tr");
	// rowDiv.classList.add("row");

	rowDiv.appendChild(nameRow);
	rowDiv.appendChild(valueRow);
	rowDiv.appendChild(deleteDiv);

	var parent = document.getElementById("tablebody");
	if (previousDiv) {
		parent.insertBefore(rowDiv, previousDiv)
	} else {
		parent.appendChild(rowDiv);
	}

	//inputElements stores a map of these
	return {
		row: rowDiv,
		name: nameDiv,
		value: valueDiv,
		// source: sourceDiv,
		// type: typeDiv,
		delete: deleteDiv,
		update: function(blob) {
			if (blob) {
				valueDiv.innerHTML = (JSON.stringify(blob.value) + "").substr(0, 200);
				//Not all types are directly editable here
				valueDiv.setAttribute("contenteditable", blob.encoding == null || blob.encoding == 'utf8' || blob.encoding == 'json');
			}
		},
		deleteRow: deleteRow,
	}
}

function createOrUpdateRow(name, blob) {
	if (inputElements[name]) {
		inputElements[name].update(blob);
	} else {
		var rowBlob = createRow(name)
		rowBlob.update(blob);
		inputElements[name] = rowBlob;
	}
}

function deleteRow(name) {
	if (inputElements[name]) {
		inputElements[name].row.parentNode.removeChild(inputElements[name].row);
		delete inputElements[name];
	}
}

function updateWithNewInputs(inputMap) {
	if (!inputElements) {
		if (Object.keys(inputMap).length == 0) {
			return;
		}
		//Remove "No data" text
		var unneededText = document.getElementById("nodata");
		unneededText.innerHTML = null;
		// unneededText.parentNode.removeChild(unneededText);
		//First inputs, do these in alphabetical order
		inputElements = {};
		var keys = [];
		for (key in inputMap) {
			keys.push(key);
		}
		//We visually sort the initial values by name,
		//subsequent new values added are appended
		keys.sort();
		keys.forEach(function(inputName) {
			createOrUpdateRow(inputName, inputMap[inputName]);
		});
	} else {
		for (inputName in inputMap) {
			createOrUpdateRow(inputName, inputMap[inputName]);
		}
	}
}

metaframe.addEventListener('inputs', function(inputMap) {
	updateWithNewInputs(inputMap);
});

metaframe.addEventListener('inputsdelete', function(inputsArray) {
	inputsArray.forEach(deleteRow);
});

var addInputButton = document.getElementById("add-input-button");
addInputButton.onclick = function(ignored) {
	metaframe.setInput('foo', {value:`replaceme ${Math.random()} ${Math.random()} ${Math.random()} ${Math.random()} ${Math.random()}`});
	// createOrUpdateRow('foo', {value:'replaceme'});
}

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});