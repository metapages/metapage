/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

function on_uniprot_id(blob) {
    if (!blob) {
        return;
    }
    loadUniprotId(blob.value);
}

function loadUniprotId(uniprotId) {
    if (!uniprotId) {
        return;
    }

    // console.log('protvista uniprotId', uniprotId);
	var mainDiv = document.getElementById('main');
	while (mainDiv.firstChild) {
	    mainDiv.removeChild(mainDiv.firstChild);
	}

    document.getElementById('uniprotid').innerHTML = 'Uniprot ID: ' + uniprotId;

    // console.log('uniprotId', uniprotId);
    var ProtVista = require('ProtVista');
    var instance = new ProtVista({
        el: mainDiv,
        uniprotacc: uniprotId,
        //These categories will **not** be rendered at all
	    //exclusions: ['SEQUENCE_INFORMATION', 'STRUCTURAL', 'TOPOLOGY', 'MUTAGENESIS', 'MOLECULE_PROCESSING']
    });

    // console.log('height', $("#main").height());
    // console.log('outerHeight', $("#main").outerHeight());
    setInterval(function() {
    	// console.log('height', $("#main").height());
    	// console.log('outerHeight', $("#main").outerHeight());
    }, 1000);
    metaframe.sendDimensions({width:600, height:800});
}

metaframe.onInput("uniprot_id", on_uniprot_id);

if (metaframe.getInput("uniprot_id")) {
	on_uniprot_id(metaframe.getInput("uniprot_id"));
}

// loadUniprotId("P68871");

