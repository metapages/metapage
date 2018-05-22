/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

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
	var url = 'https://files.rcsb.org/download/' + pdbId.toUpperCase() + '.pdb';
	fetch(url)
		.then(function (response) {
			if(response.ok) {
				metaframe.setOutput("pdb_id", {value:pdbId});
				metaframe.setInput("pdb_id", {value:pdbId});
				return response.text();
			} else {
				debug(response);
				metaframe.setOutput("pdb_data", {value:null});
				return null;
			}
		})
		.then(function(pdb_data) {
			if (pdb_data != null) {
				metaframe.setOutput("pdb_data", {value:pdb_data});
			}
		})
		.catch(function (error) {
			debug(error);
			metaframe.setOutput("pdb_data", {value:null});
		});
}

document.getElementById('pdbid').addEventListener('keypress', function (e) {
	var key = e.which || e.keyCode;
	if (key === 13) { // 13 is enter
		sendPdbId();
	}
});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
	if (metaframe.getInputs() && metaframe.getInputs()['pdb_id']) {
		document.getElementById('pdbid').value = metaframe.getInputs()['pdb_id'].value;
	} else {
		document.getElementById('pdbid').value = "1C7D";
	}
	sendPdbId();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});
