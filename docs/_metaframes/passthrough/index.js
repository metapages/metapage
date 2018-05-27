/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:true});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;

//Creates javascript object with methods
function createRow(name) {
	var nameDiv = document.createElement("td");
	nameDiv.classList.add("box-name");
	nameDiv.innerHTML = name;

	var valueDiv = document.createElement("td");
	valueDiv.classList.add('box-value');
	// valueDiv.classList.add("box-value");

	// var sourceDiv = document.createElement("td");
	// sourceDiv.classList.add("box-source");

	// var typeDiv = document.createElement("td");
	// typeDiv.classList.add("box-type");

	var deleteDiv = document.createElement("td");
	deleteDiv.classList.add('box-delete');
	var deleteButton = document.createElement("button")
	deleteDiv.appendChild(deleteButton);
	deleteButton.classList.add('button', 'is-danger', 'is-small');
	deleteButton.onclick = function() {
		metaframe.deleteInputs(name);
	};

	// typeDiv.classList.add("box-type");

	var rowDiv = document.createElement("tr");
	// rowDiv.classList.add("row");

	rowDiv.appendChild(nameDiv);
	rowDiv.appendChild(valueDiv);
	rowDiv.appendChild(deleteDiv);

	var parent = document.getElementById("tablebody");
	parent.appendChild(rowDiv);

	//inputElements stores a map of these
	return {
		row: rowDiv,
		name: nameDiv,
		value: valueDiv,
		// source: sourceDiv,
		// type: typeDiv,
		delete: deleteDiv,
		update: function(blob) {
			valueDiv.innerHTML = (JSON.stringify(blob.value) + "").substr(0, 200);
			// sourceDiv.innerHTML = blob.source;
		},
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
	console.log('inputs', inputMap);
	updateWithNewInputs(inputMap);
});

metaframe.addEventListener('inputsdelete', function(inputsArray) {
	console.log('inputsdelete', inputsArray);
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