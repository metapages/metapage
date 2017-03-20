---
---

var connectionManager = new Metapage({debug:false});
var metaframe = null;
var inputTypes = {};

function sanitizeUrl(inputUrl) {
	var url = inputUrl;
	if (!url.startsWith('http')) {
		while(url.startsWith('/')) {
			url = url.substr(1);
		}
		url = location.protocol + '//' + location.hostname + (location.port != null && location.port != '' ? ':' + location.port: '') + '/' + url;
	}
	return url;
}

function getInputNamed(name) {
	name = name.trim();
	var children = document.getElementById("inputs").children;
	for (var i = 0; i < children.length; i++) {
		var inputDiv = children[i];
		var nameElement = inputDiv.getElementById("InputName");
		if (nameElement.value.trim() == name) {
			return inputDiv;
		}
	}
	return null;
}

function createOutput(name, value) {
	var table = document.getElementById("outputs-table");
	var row = table.insertRow(row, table.rows);

	var cellName = document.createElement("td");
	row.appendChild(cellName);
	cellName.textContent = name;
	cellName.id = "OutputName" + name;

	var cellValue = document.createElement("td");
	row.appendChild(cellValue);
	var cellTextArea = document.createElement("textarea");
	cellValue.appendChild(cellTextArea);

	cellTextArea.textContent = value;
	cellTextArea.id = "OutputValue" + name;

	return row;
}

function getOutput(name) {
	return document.getElementById("OutputValue" + name.trim());
}

function setOutput(name, value) {
	var element = getOutput(name);
	if (element == null) {
		createOutput(name, value);
		element = getOutput(name);
	}
	// if (typeof(value) == 'string' && value.startsWith('http')) {
	// 	value = '<a href="' + value + '">' + value + '</a>';
	// }
	element.innerHTML = value;
}

function createInput(name, type, value) {
	var table = document.getElementById("inputs-table");
	var row = table.insertRow(row, table.rows);

	var cellName = document.createElement("td");
	row.appendChild(cellName);
	var nameInput = document.createElement("input");
	nameInput.class = "form-control";
	cellName.appendChild(nameInput);

	var cellType = document.createElement("td");
	row.appendChild(cellType);
	if (type) {
		cellType.innerHTML = type;
	}

	if (type == null) {
		type == 'string';
	}

	cellType.innerHTML = type;

	var cellValue = document.createElement("td");
	row.appendChild(cellValue);
	var valueInput = document.createElement("textarea");
	valueInput.class = "form-control";

	cellValue.appendChild(valueInput);
	if (value) {
		valueInput.value = value;
	}

	var removeElement = document.createElement("td");
	row.appendChild(removeElement);
	var removeButton = document.createElement("button");
	removeButton.class = "btn btn-default";
	removeButton.type = "submit";
	removeButton.innerHTML = '-';
	removeElement.appendChild(removeButton);
	removeButton.onclick = function(e) {
		table.deleteRow(row.rowIndex);
	};

	var changeName = function(newName) {
		nameInput.value = newName;
		nameInput.id = "InputName" + newName;
		valueInput.id = "InputValue" + newName;
	}

	if (name) {
		changeName(name);
	}

	valueInput.addEventListener('keypress', function (e) {
		var key = e.which || e.keyCode;
		if (key === 13) { // 13 is enter
			sendInputs();
		}
	});

	return row;
}

function getConvertedValue(input) {
	if (input.value !== '' && inputTypes[input.name]) {
		switch(inputTypes[input.name]) {
			case 'json':
				return JSON.parse(input.value);
				break;
			case 'float':
			case 'number':
				try {
					return parseFloat(input.value);
				} catch(err) {
					console.error(err);
				}
				break;
			default:
				return input.value;
		}
	} else {
		return input.value;
	}
}

function sendInputs() {
	var table = document.getElementById("inputs-table");
	var rows = table.rows;
	var inputs = [];
	for (var i = 1; i < rows.length; i++) {
		var row = rows[i];
		var name = row.cells[0].children[0].value;
		var value = row.cells[2].children[0].value;
		value = getConvertedValue({name, value});
		inputs.push({name:name, value:value});
	}
	if (metaframe) {
		console.log('Setting metaframe', inputs);
		metaframe.setInputs(inputs);
	}
}

/**
 * If we got a blob JSON describing the metaframe
 * then we can pre-create the input fields
 */
function setInputs(inputs) {
	var table = document.getElementById("inputs-table");
	while (table.rows.length > 1) {
		table.deleteRow(table.rows.length - 1);
	}
	for (var i = 0; i < inputs.length; i++) {
		var inputData = inputs[i];
		createInput(inputData.name,inputData.type);
		inputTypes[inputData.name] = inputData.type;
		if (inputData.value) {
			var valueElement = document.getElementById("InputValue" + inputData.name);
			var value = inputData.value;
			if (inputData.type == 'json') {
				value = JSON.stringify(inputData.value);
			}
			valueElement.value = value;//JSON.stringify(inputData.value);
			if (metaframe) {
				metaframe.setInput(inputData.name, inputData.value);
			}
		} else {
			console.log('no value for ', inputData);
		}
	}
}
$('#addInputButton').on('click', function (e) {
	createInput('NEW ROW');
});

$('#sendButton').on('click', function (e) {
	var table = document.getElementById("outputs-table");
	var rows = table.rows;
	var i = rows.length;
	while (--i) {
		table.deleteRow(i);
	}
	sendInputs();
});

$('#buttonGoToUrl').on('click', function (e) {
	var currentUrl = document.getElementById("inputUrl").value;
	onNewUrl(currentUrl);
});

/**
 * Reset everything, and rebuild
 */
function onNewUrl(url) {
	//update the visible link
	var a = document.createElement('a');
	a.setAttribute('href', url);
	a.innerHTML = 'Go to metaframe';
	const urlContainer = document.getElementById('urlLink');
	while (urlContainer.firstChild) {
	    urlContainer.removeChild(urlContainer.firstChild);
	}
	urlContainer.appendChild(a);

	//Update the metaframe
	connectionManager.removeAll();
	metaframe = connectionManager.createIFrame(url);
	metaframe.iframe.id = 'metaframe';
	document.getElementById("metaframes").appendChild(metaframe.iframe);
	// Make a request for a user with a given ID
	var metaframeJsonUrl = url;
	if (!metaframeJsonUrl.endsWith('/')) {
		metaframeJsonUrl = metaframeJsonUrl + '/';
	}
	metaframeJsonUrl = metaframeJsonUrl + 'metaframe.json';
	axios.get(metaframeJsonUrl)
		.then(function (response) {
			if (response.data && response.data.inputs) {
				//Clear out the original inputs
				setInputs(response.data.inputs);
			} else {
				console.log('Got metapage.json but no inputs array.');
			}
		})
		.catch(function (error) {
			console.warn('No metaframe.json @ ' + metaframeJsonUrl, error);
		});

	metaframe.onOutput(function(pipeName, value) {
		setOutput(pipeName, value);
	});
}

//Parse the "url" parameter out of the query string, if it exists.
const qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

var url = qs['url'];

if (url != null) {
	url = sanitizeUrl(url);
	document.getElementById("inputUrl").value = url;
	onNewUrl(url);
}
