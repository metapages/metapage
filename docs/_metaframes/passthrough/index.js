var urlObject = new URL(window.location.href);
var disableEditParam = urlObject.searchParams.get('edit') == '0' || urlObject.searchParams.get('debug') == 'false';
var debugParam = urlObject.searchParams.get('debug') == '1' || urlObject.searchParams.get('debug') == 'true';

/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;

function htmlDecode(input){
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

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
	valueBlob.v = 1;
	metaframe.setInput(next, valueBlob);
	//This causes downstream cleanup
	metaframe.deleteInput(prev);
}

//Creates javascript object with methods
function createRow(name, previousDiv) {

	var rowDiv = document.createElement("div");
	rowDiv.classList.add('input-row');

	var nameDiv = document.createElement("div");
	nameDiv.classList.add('has-text-info');

	var valueDiv = document.createElement("div");
	valueDiv.classList.add('column-value');
	valueDiv.classList.add('input-row-element-value', 'input-row-element-value-textarea');
	valueDiv.setAttribute("contenteditable", true);
	// var valueTextArea = document.createElement("textarea");
	// valueTextArea.classList.add('input-row-element-value-textarea');
	// valueDiv.appendChild(valueTextArea);
	// valueTextArea.classList.add('autoExpand');
	// valueTextArea.type = 'text';

	var deleteDiv = document.createElement("div");

	var divs  = [nameDiv, valueDiv, deleteDiv];
	var names = ['name', 'value', 'delete'];
	for (var i = 0; i < ['name', 'value', 'delete'].length; i++) {
		divs[i].classList.add('input-row-element', `input-row-element-${names[i]}`);
		rowDiv.appendChild(divs[i]);
	}

	nameDiv.classList.add("column-name", "prop-text");
	nameDiv.innerHTML = name;
	nameDiv.setAttribute("contenteditable", true);

	var isdeleted = false;

	var editingName = false;
	var finishEditingName = function() {
		if (isdeleted || !editingName) {
			return;
		}
		editingName = false;
		if (name != nameDiv.innerHTML) {
			rename(name, nameDiv.innerHTML);
		}
		nameDiv.onkeydown = null;
	}
	var inputListenerName = function(anything) {
		if (!editingName) {
			editingName = true;
			//Capture enter and send changed name
			nameDiv.onkeydown = function (e) {
				if (!e) {
					e = window.event;
				}
				var keyCode = e.which || e.keyCode,
					target = e.target || e.srcElement;

				if (keyCode === 13 && !e.shiftKey) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					finishEditingName();
				}
			};
		}
	}

	var editingValue = false;
	var finishEditingValue = function() {
		if (isdeleted || !editingValue) {
			return;
		}
		editingValue = false;
		var value = valueDiv.innerHTML;
		if (value) {
			// value = value.replace(/&amp;/g, '&');
			// value = value.replace('&amp;', '&');
			value = htmlDecode(value);
		}
		metaframe.setInput(name, {value:value});
		valueDiv.onkeydown = null;
		valueDiv.setAttribute("contenteditable", false);
		setTimeout(function() {
			valueDiv.setAttribute("contenteditable", true);
		}, 0);
	}
	var inputListenerValue = function(anything) {
		if (!editingValue) {
			editingValue = true;
			//Capture enter and send changed name
			valueDiv.onkeydown = function (e) {
				if (!e) {
					e = window.event;
				}
				var keyCode = e.which || e.keyCode,
					target = e.target || e.srcElement;

				if (keyCode === 13 && !e.shiftKey) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					finishEditingValue();
				}
			};
		}
	}

	var deleteButton;
	if (!disableEditParam) {
		deleteDiv.classList.add('column-delete');
		deleteButton = document.createElement("a");
		deleteButton.innerHTML = `<span class="icon is-small">
	        <i class="icon-cancel"></i>
	      </span>`;


	    deleteButton.classList.add('button', 'is-danger', 'is-outlined');
		deleteDiv.appendChild(deleteButton);
	}

	nameDiv.addEventListener("input", inputListenerName, false);
	valueDiv.addEventListener("input", inputListenerValue, false);

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
		nameDiv.removeEventListener("input", inputListenerName);
		nameDiv.onkeydown = null;
		valueDiv.removeEventListener("input", inputListenerValue);
		metaframe.deleteInputs(name);
	}

	if (deleteButton) {
		deleteButton.onclick = deleteRow;
	}

	var parent = document.getElementById("input-rows");
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
				if (!blob.value) {
					valueDiv.innerHTML = null;
					// valueTextArea.value = null;
				} else if (typeof(blob.value) == 'object') {
					valueDiv.innerHTML = JSON.stringify(blob.value);
					// valueTextArea.value = JSON.stringify(blob.value);
				} else {
					if (blob.encoding == 'base64') {
						valueDiv.innerHTML = atob(blob.value);
						// valueTextArea.value = atob(blob.value);
					} else {
						valueDiv.innerHTML = `${blob.value}`;
						// valueTextArea.value = `${blob.value}`;
					}
				}
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
		if (unneededText) {
			unneededText.innerHTML = null;
		}
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
	//Then pass all through
	metaframe.setOutputs(inputMap);
}

metaframe.addEventListener(Metaframe.INPUTS, function(inputMap) {
	updateWithNewInputs(inputMap);
});

metaframe.addEventListener(Metaframe.INPUTSDELETE, function(inputsArray) {
	inputsArray.forEach(deleteRow);
});

if (disableEditParam) {
	var header = document.getElementById('header');
	header.parentNode.removeChild(header);
	// addInputButton.parentNode.removeChild(addInputButton);
} else {
	var addInputButton = document.getElementById('add-input-button');
	addInputButton.onclick = function(ignored) {
		//Get a safe new name
		var proposedNameBase = 'new-input';
		var proposedName = proposedNameBase;
		if (inputElements) {
			var ok = false;
			var count = 0;
			do {
				ok = true;
				for (name in inputElements) {
					if (name == proposedName) {
						count++;
						proposedName = `${proposedNameBase}${count}`;
						ok = false;
						break;
					}
				}
			}
			while(!ok);
		}
		metaframe.setInput(proposedName, {value:`replaceme`});
	}
}


metaframe.ready.then(function() {
	// metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});
