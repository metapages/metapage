/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:true});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;

function rename(prev, next) {
	if (!metaframe.getInput(prev) || !inputElements[prev]) {
		return;
	}
	if (prev == next) {
		return;
	}
	//Create the new with the different name, same value
	var previousBlob = inputElements[prev];
	var rowBlob = createRow(next, previousBlob.row);

	inputElements[next] = rowBlob;
	var valueBlob = metaframe.getInput(prev);
	console.log(`rename ${prev} ${next} previousDiv=${previousBlob.row != null} valueBlob=${valueBlob}`);
	valueBlob.v = 1;
	rowBlob.update(metaframe.getInput(prev));
	metaframe.setInput(next, valueBlob);

	//Delete the previous
	delete inputElements[prev];
	previousBlob.deleteRow();
}

//Creates javascript object with methods
function createRow(name, previousDiv) {
	var nameRow = document.createElement("td");
	var nameDiv = document.createElement("div");
	nameRow.appendChild(nameDiv);
	nameDiv.classList.add("box-name");
	nameDiv.innerHTML = name;
	nameDiv.setAttribute("contenteditable", true);

	var isdeleted = false;
	// var isListening = false;


	var nameTimer;
	var editing = false;

	var finishEditing = function() {
		if (isdeleted || !editing) {
			return;
		}
		editing = false;
		if (name != nameDiv.innerHTML) {
			console.log(`Save name=${nameDiv.innerHTML}`);
			rename(name, nameDiv.innerHTML);
			// nameDiv.setAttribute("contenteditable", false);
			// setTimeout(function() {
			// 	nameDiv.setAttribute("contenteditable", true);
			// }, 0);
		}
		nameDiv.onkeydown = null;
		// if (nameTimer) {
		// 	clearTimeout(nameTimer);
		// 	nameTimer = null;
		// }
	}



	var inputListener = function(anything) {
		console.log('input');
		
		//Clear the current countdown
		// if (nameTimer) {
		// 	clearTimeout(nameTimer);
		// 	nameTimer = null;
		// }

		// //Start a 1 second countdown, save the
		// //changed name afterwards
		// nameTimer = setTimeout(function() {
		// 	if (isdeleted) {
		// 		return;
		// 	}
		// 	finishEditing();
		// }, 3000);

		if (!editing) {
			editing = true;
			// isListening = true;

			nameDiv.onkeydown = function (e) {
				console.log('keydown');
				if (!e) {
					e = window.event;
				}
				var keyCode = e.which || e.keyCode,
					target = e.target || e.srcElement;

				if (keyCode === 13 && !e.shiftKey) {
					console.log('Just enter');
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					// target.innerHTML = '';
					finishEditing();
				}
			};
		}
	}
	nameDiv.addEventListener("input", inputListener, false);

	contenteditable="true"
	var valueRow = document.createElement("td");
	var valueDiv = document.createElement("div");
	valueRow.appendChild(valueDiv);
	valueDiv.classList.add('box-value');
	valueDiv.setAttribute("contenteditable", true);
	// valueDiv.addEventListener("input", function(anything) {
	// 	console.log('input');
	// 	console.log(anything);
	// }, false);

	// var sourceDiv = document.createElement("td");
	// sourceDiv.classList.add("box-source");

	// var typeDiv = document.createElement("td");
	// typeDiv.classList.add("box-type");

	var deleteDiv = document.createElement("td");
	deleteDiv.classList.add('box-delete');
	var deleteButton = document.createElement("button")
	deleteDiv.appendChild(deleteButton);
	deleteButton.classList.add('button', 'is-danger', 'is-small');

	// typeDiv.classList.add("box-type");

	var rowDiv = document.createElement("tr");
	// rowDiv.classList.add("row");

	rowDiv.appendChild(nameRow);
	rowDiv.appendChild(valueRow);
	rowDiv.appendChild(deleteDiv);

	function deleteRow() {
		if (isdeleted) {
			return;
		}
		isdeleted = true;
		if (rowDiv.parentElement) {
			rowDiv.parentElement.removeChild(rowDiv);
		} else {
			console.error(`Missing parentElement for ${name}`);
		}
		delete inputElements[name];
		nameDiv.removeEventListener("input", inputListener);
		nameDiv.onkeydown = null;
		metaframe.deleteInputs(name);
	}

	deleteButton.onclick = deleteRow;

	var parent = document.getElementById("tablebody");
	console.log(`creating ${name} is previousDiv=${previousDiv != null}`);
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