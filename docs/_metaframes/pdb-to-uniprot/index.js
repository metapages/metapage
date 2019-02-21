/* Set up the metaframe channel */
var metaframe = new metaframe.Metaframe({debug:false});

function setText(text) {
	document.getElementById("output").innerHTML = text;
}

setText("Loading...");

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

var pdbToUniprotMap = null;

function maybeSendPdbId() {
	if (pdbToUniprotMap && metaframe.getInput('pdb_id') && metaframe.getInput('pdb_id').value != null) {
  		var pdbId = metaframe.getInput('pdb_id').value.toUpperCase();
  		// setText(pdbId + "=> NOT READY");
  		if (pdbToUniprotMap && pdbId) {
			if (pdbToUniprotMap[pdbId]) {
				  setText(pdbId + "=>" + (pdbToUniprotMap[pdbId] ? pdbToUniprotMap[pdbId] : "none"));
		  		metaframe.setOutput('uniprot_id', {value:pdbToUniprotMap[pdbId]});
		  	} else {
		  		setText(pdbId + "=> none");
          metaframe.setOutput('uniprot_id', {value:null});
		  		metaframe.setOutput('error', {value:"No mapping for " + pdbId});
		  	}
		}
  	}
}

metaframe.setOutput('status', {value:'loading'});

fetch('data.json')
  .then(function (response) {
  	return response.json();
  })
  .then(function(jsonResponse) {
  	pdbToUniprotMap = jsonResponse;
  	setText("Ready.");
  	metaframe.setOutput('status', {value:'ready'});
  	maybeSendPdbId();
  })
  .catch(function (error) {
  	console.error('failed data.json response');
    console.error(error);
  });

metaframe.onInput("pdb_id", function(blob) {
	maybeSendPdbId();
});
