/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:true});

var inputElement = document.getElementById("input");
function handleFiles() {
  var fileList = this.files; /* now you can work with the file list */
  var file = fileList[0];

  var reader = new FileReader();
	reader.onload = function(e) {
		var text = reader.result;
		metaframe.setOutput({name:"pdb_data", value:text});
	}

	reader.readAsText(file);
}

inputElement.addEventListener("change", handleFiles, false);

function sendPdbId() {
	var pdbId = document.getElementById('pdbid').value;
	metaframe.setOutput("pdb_id", {value:pdbId});
	fetch('https://files.rcsb.org/download/' + pdbId.toUpperCase() + '.pdb')
		.then(function (response) {
			var pdbdata = response.data;
			metaframe.setOutput("pdb_data", {value:pdbdata});
		})
		.catch(function (error) {
			console.error(error);
		});
}

document.getElementById('pdbid').addEventListener('keypress', function (e) {
	var key = e.which || e.keyCode;
	if (key === 13) { // 13 is enter
		sendPdbId();
	}
});

document.getElementById('pdbid').value = "1c7d";

metaframe.ready.then(function() {
	metaframe.sendDimensions();
	sendPdbId();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});
