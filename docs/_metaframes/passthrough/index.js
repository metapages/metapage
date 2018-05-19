/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

// var values = {};
// var valueNameOrder = [];

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = null;//{};

//Creates javascript object with methods
function createRow(name) {
	var nameDiv = document.createElement("div");
	nameDiv.classList.add("box-name");
	nameDiv.innerHTML = name;

	var valueDiv = document.createElement("div");
	valueDiv.classList.add("box-value");

	var sourceDiv = document.createElement("div");
	sourceDiv.classList.add("box-source");

	var typeDiv = document.createElement("div");
	typeDiv.classList.add("box-type");

	var rowDiv = document.createElement("div");
	rowDiv.classList.add("row");

	rowDiv.appendChild(nameDiv);
	rowDiv.appendChild(valueDiv);

	return {
		row: rowDiv,
		name: nameDiv,
		value: valueDiv,
		source: sourceDiv,
		type: typeDiv,
	}
}

function updateRow(name, blob, rowDivBlob) {
	rowDivBlob.value.innerHTML = (JSON.stringify(blob.value) + "").substr(0, 200);
	rowDivBlob.source.innerHTML = blob.source;
}

function createOrUpdateRow(name, blob) {
	if (inputElements[name]) {
		updateRow(name, blob, inputElements[name]);
	} else {
		var rowBlob = createRow(name)
		updateRow(name, blob, rowBlob);

		inputElements[name] = rowBlob;
		var parent = document.getElementById("column");
		parent.appendChild(rowBlob.row);
	}
}

metaframe.addEventListener("inputs", function(inputMap) {
	if (!inputElements) {
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




// 	var value = inputBlob.value;
// 	if (!(pipeName in inputElements)) {
// 		//Create the row showing the input value
// 		var row = document.createElement("tr");

// 	    var nameColumn = document.createElement("td");
// 	    row.appendChild(nameColumn);
// 	    nameColumn.innerHTML = pipeName;

// 	    var valueColumn = document.createElement("td");
// 	    row.appendChild(valueColumn);
// 	    inputElements[pipeName] = valueColumn;

// 	    document.getElementById("inputs").appendChild(row);
// 	    metaframe.sendDimensions();
// 	}
// 	inputElements[pipeName].innerHTML = (value + "").substr(0, 15);
// 	metaframe.setOutput(pipeName, inputBlob);
// });

// QueryString = function () {
//   // This function is anonymous, is executed immediately and
//   // the return value is assigned to QueryString!
//   var query_string = {};
//   var query = window.location.search.substring(1);
//   var vars = query.split("&");
//   for (var i=0;i<vars.length;i++) {
//     var pair = vars[i].split("=");
//         // If first entry with this name
//     if (typeof query_string[pair[0]] === "undefined") {
//       query_string[pair[0]] = decodeURIComponent(pair[1]);
//         // If second entry with this name
//     } else if (typeof query_string[pair[0]] === "string") {
//       var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
//       query_string[pair[0]] = arr;
//         // If third or later entry with this name
//     } else {
//       query_string[pair[0]].push(decodeURIComponent(pair[1]));
//     }
//   }
//   return query_string;
// }();

// if (QueryString.direction == 'up') {
// 	document.getElementById("arrow_box").className = "arrow_box_top";
// }
// if (QueryString.direction == 'down') {
// 	document.getElementById("arrow_box").className = "arrow_box_bottom";
// }
// if (QueryString.direction == 'left') {
// 	document.getElementById("arrow_box").className = "arrow_box_left";
// }
// if (QueryString.direction == 'right') {
// 	document.getElementById("arrow_box").className = "arrow_box_right";
// }
