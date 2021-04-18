/* Set up the metaframe channel */
var metaframe = new metapage.Metaframe();

function on_uniprot_id(blob) {
    if (!blob) {
        return;
    }
    loadUniprotId(blob);
}

function loadUniprotId(uniprotId) {
    // console.log('protvista uniprotId', uniprotId);
	var mainDiv = document.getElementById('main');
	while (mainDiv.firstChild) {
	    mainDiv.removeChild(mainDiv.firstChild);
	}

    if (!uniprotId) {
        document.getElementById('uniprotid').innerHTML = 'Uniprot ID: none';
        return;
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
}

metaframe.onInput("uniprot_id", on_uniprot_id);

if (metaframe.getInput("uniprot_id")) {
	on_uniprot_id(metaframe.getInput("uniprot_id"));
}

// loadUniprotId("P68871");
