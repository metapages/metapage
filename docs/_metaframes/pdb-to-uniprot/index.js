/* Set up the metaframe channel */
var metaframe = new metapage.Metaframe();

function setText(text) {
	document.getElementById("output").innerHTML = text;
}

setText("Loading...");

var pdbToUniprotMap = null;

function maybeSendPdbId() {
	if (pdbToUniprotMap && metaframe.getInput('pdb_id') != null) {
  		var pdbId = metaframe.getInput('pdb_id').toUpperCase();
  		// setText(pdbId + "=> NOT READY");
  		if (pdbToUniprotMap && pdbId) {
			if (pdbToUniprotMap[pdbId]) {
				  setText(pdbId + "=>" + (pdbToUniprotMap[pdbId] ? pdbToUniprotMap[pdbId] : "none"));
		  		metaframe.setOutput('uniprot_id', pdbToUniprotMap[pdbId]);
		  	} else {
		  		setText(pdbId + "=> none");
          metaframe.setOutput('uniprot_id', null);
		  		metaframe.setOutput('error', "No mapping for " + pdbId);
		  	}
		}
  	}
}

metaframe.setOutput('status', 'loading');

fetch('data.json')
  .then(function (response) {
  	return response.json();
  })
  .then(function(jsonResponse) {
  	pdbToUniprotMap = jsonResponse;
  	setText("Ready.");
  	metaframe.setOutput('status', 'ready');
  	maybeSendPdbId();
  })
  .catch(function (error) {
  	console.error('failed data.json response');
    console.error(error);
  });

metaframe.onInput("pdb_id", function(blob) {
	maybeSendPdbId();
});
