/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false, showBanner:true});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

/*
 * On input pipe update, show value, and pass to output pipe
 */
var inputElements = {};

metaframe.addEventListener("input", function(pipe, value) {
	if (!(pipe in inputElements)) {
		//Create the row showing the input value
		var row = document.createElement("tr");

	    var nameColumn = document.createElement("td");
	    row.appendChild(nameColumn);
	    nameColumn.innerHTML = pipe;

	    var valueColumn = document.createElement("td");
	    row.appendChild(valueColumn);
	    inputElements[pipe] = valueColumn;

	    document.getElementById("inputs").appendChild(row);
	    metaframe.sendDimensions();
	}
	inputElements[pipe].innerHTML = (value + "").substr(0, 15);
	metaframe.setOutput(pipe, value);
});

QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

if (QueryString.direction == 'up') {
	document.getElementById("arrow_box").className = "arrow_box_top";
}
if (QueryString.direction == 'down') {
	document.getElementById("arrow_box").className = "arrow_box_bottom";
}
if (QueryString.direction == 'left') {
	document.getElementById("arrow_box").className = "arrow_box_left";
}
if (QueryString.direction == 'right') {
	document.getElementById("arrow_box").className = "arrow_box_right";
}
