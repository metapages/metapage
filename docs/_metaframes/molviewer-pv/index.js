var metaframe = new Metaframe({debug:false});

//Initialize the viewer
// override the default options with something less restrictive.
var width = 300;
var height = 300;
var options = {
  width: width,
  height: height,
  antialias: true,
  quality : 'medium',
  background: 'grey'
};

// insert the viewer under the Dom element with id 'gl'.
var viewer = pv.Viewer(document.getElementById('viewer'), options);
var viewerReady = false;
var hasStructure = false;
var cameraIn = null;

function showStructure(structure) {
	hasStructure = true;
	viewer.clear();
	viewer.cartoon('protein', structure, { color : color.ssSuccession() });
  	viewer.centerOn(structure);
}

viewer.on('viewerReady', function() {
	viewerReady = true;

	viewer.on('viewpointChanged', function(cam) {
		metaframe.setOutputs({
			"rotation": {value:viewer.rotation()},
			"zoom": {value:viewer.zoom()},
		});
		// metaframe.setOutput("zoom", {value:viewer.zoom()});
	});

	viewer.addListener('click', function(picked) {
		if (picked === null) return;
		var target = picked.target();
		if (target.qualifiedName !== undefined) {
			console.log('clicked atom', target.qualifiedName(), 'on object', picked.node().name());
		}
	});

	if (metaframe.getInput("pdb_data") != null) {
		var pdb_data = metaframe.getInput("pdb_data").value;
		var structure = pv.io.pdb(pdb_data);
		showStructure(structure);
	}
});

/* Set up the metaframe channel */
metaframe.ready.then(function() {
	metaframe.sendDimensions({width:width,height:height});
}, function(err) {
	metaframe.error('molviewer: Error setting up the metaframe connection error=' + JSON.stringify(err));
});

/*
 * On input pipe update, send value to the graph
 */
metaframe.onInput("pdb_data", function(inputBlob) {
	var pdb_data = inputBlob.value;
	metaframe.debug('pdb_data=' + (pdb_data != null ? pdb_data.substr(0, 200) : null));
	if (pdb_data != null && viewerReady) {
		metaframe.debug('Setting pdb data to pv viewer');
	    var structure = pv.io.pdb(pdb_data);
	    showStructure(structure);
	}
});

metaframe.onInput("pdb_id", function(inputBlob) {
	var pdb_id = inputBlob.value;
	metaframe.debug('pdb_id=' + pdb_id);
	if (pdb_id != null && viewerReady) {
		  pv.io.fetchPdb('https://files.rcsb.org/download/' + pdb_id + '.pdb', function(structure) {
		      showStructure(structure);
		  });
	}
});

metaframe.onInput("pdb_url", function(inputBlob) {
	var pdb_url = inputBlob.value;
	metaframe.debug('pdb_url=' + pdb_url);
	if (pdb_url != null && viewerReady) {
		  pv.io.fetchPdb(pdb_url, function(structure) {
		      showStructure(structure);
		  });
	}
});

metaframe.onInput("rotation", function(inputBlob) {
	var rotation = inputBlob.value;
	metaframe.debug('rotation in=' + (rotation != null ? rotation : null) + ', viewerReady=' + viewerReady);
	if (viewerReady && rotation != null && typeof(rotation) == 'object') {
		metaframe.debug('SETTING ROTATION=' + rotation);
		viewer.setRotation(rotation);
	} else {
		metaframe.debug('rotation == null or !viewerReady');
	}
});

metaframe.onInput("zoom", function(inputBlob) {
	var zoom = inputBlob.value;
	zoom = parseFloat(zoom + "");
	metaframe.debug('zoom in=' + (zoom != null ? zoom : null) + ', viewerReady=' + viewerReady);
	if (viewerReady && zoom != null && typeof(zoom) == 'number') {
		metaframe.debug('SETTING zoom=' + zoom);
		viewer.setZoom(zoom);
		viewer.setRotation(viewer.rotation());
	} else {
		metaframe.debug('zoom == null or !viewerReady');
	}
});
