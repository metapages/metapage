/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;//{};

//Creates javascript object with methods
function createRow(name) {
	var nameDiv = document.createElement("td");
	nameDiv.classList.add("box-name");
	nameDiv.innerHTML = name;

	var valueDiv = document.createElement("td");
	// valueDiv.classList.add("box-value");

	var sourceDiv = document.createElement("td");
	// sourceDiv.classList.add("box-source");

	var typeDiv = document.createElement("td");
	// typeDiv.classList.add("box-type");

	var rowDiv = document.createElement("tr");
	// rowDiv.classList.add("row");

	rowDiv.appendChild(nameDiv);
	rowDiv.appendChild(valueDiv);

	var parent = document.getElementById("tablebody");
	parent.appendChild(rowDiv);

	return {
		row: rowDiv,
		name: nameDiv,
		value: valueDiv,
		source: sourceDiv,
		type: typeDiv,
		update: function(blob) {
			valueDiv.innerHTML = (JSON.stringify(blob.value) + "").substr(0, 200);
			sourceDiv.innerHTML = blob.source;
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

metaframe.addEventListener("inputs", function(inputMap) {
	if (!inputElements) {
		//Remove "No data" text
		var unneededText = document.getElementById("nodata");
		unneededText.parentNode.removeChild(unneededText);
		//First inputs, do these in alphabetical order
		inputElements = {};
		var keys = [];
		for (key in inputMap) {
			keys.push(key);
		}
		keys.sort();
		keys.forEach(function(inputName) {
			createOrUpdateRow(inputName, inputMap[inputName]);
		});
	} else {
		for (inputName in inputMap) {
			createOrUpdateRow(inputName, inputMap[inputName]);
		}
	}
});
