/* Set up the metaframe channel */
var metaframe = new Metaframe({debug:false, showBanner:true});

metaframe.ready.then(function() {
	metaframe.sendDimensions();
}, function(err) {
	metaframe.error('Error setting up the metaframe connection');
});

function loadUniprotId(uniprotId) {
	var mainDiv = document.getElementById('main');
	while (mainDiv.firstChild) {
	    mainDiv.removeChild(mainDiv.firstChild);
	}
    var ProtVista = require('ProtVista');
    var instance = new ProtVista({
        el: mainDiv,
        uniprotacc: uniprotId,
        //These categories will **not** be rendered at all
	    exclusions: ['SEQUENCE_INFORMATION', 'STRUCTURAL', 'TOPOLOGY', 'MUTAGENESIS', 'MOLECULE_PROCESSING']
    });

    console.log('height', $("#main").height());
    console.log('outerHeight', $("#main").outerHeight());
    setInterval(function() {
    	console.log('height', $("#main").height());
    	console.log('outerHeight', $("#main").outerHeight());
    }, 1000);
    metaframe.sendDimensions({width:600, height:800});
}

metaframe.onInput("uniprot_id", loadUniprotId);

if (metaframe.getInput("uniprot_id")) {
	loadUniprotId(metaframe.getInput("uniprot_id"));
}

loadUniprotId("P68871");

