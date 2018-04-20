/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

var pdbToUniprotMap = null;

function maybeSendPdbId() {
	if (metaframe.getInput('pdb_id')) {
  		var pdbId = metaframe.getInput('pdb_id').toUpperCase();
  		if (pdbToUniprotMap) {
			if (pdbToUniprotMap[pdbId]) {
				console.log(pdbId + '=' + pdbToUniprotMap[pdbId]);
		  		metaframe.setOutput({name:'uniprot_id', value:pdbToUniprotMap[pdbId]});
		  	} else {
		  		metaframe.setOutput({name:'error', value:"No mapping for " + pdbId});
		  	}
		}
  	}
}

metaframe.setOutput({name:'status', value:'loading'});
axios.get('data.json')
  .then(function (response) {
  	pdbToUniprotMap = response.data;

  	maybeSendPdbId();

  	metaframe.setOutput({name:'status', value:'ready'});

  })
  .catch(function (error) {
    console.error(error);
  });

metaframe.onInput("pdb_id", function(pdbId) {
	console.log('pdb converter on input pdb_id=' + pdbId);
	maybeSendPdbId();
});

