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

function setLabel(text) {
	document.getElementById("label").innerHTML = text;
}

setLabel("Waiting for data...");


function showStructure(structure) {
	hasStructure = true;
	viewer.clear();
	viewer.cartoon('protein', structure, { color : color.ssSuccession() });
  	viewer.centerOn(structure);
}

function onPdbData(pdb_data) {
	if (!viewerReady) {
		return;
	}
	metaframe.debug('pdb_data=' + (pdb_data != null ? pdb_data.substr(0, 200) : null));
	if (pdb_data != null) {
		metaframe.debug('Setting pdb data to pv viewer');
	    var structure = pv.io.pdb(pdb_data);
	    showStructure(structure);
	} else {
		viewer.clear();
	}
}

function onPdbId(pdb_id) {
	if (!viewerReady) {
		return;
	}
	metaframe.debug('pdb_id=' + pdb_id);
	if (pdb_id != null && viewerReady) {
		setLabel("pdb_id=" + pdb_id);
		pv.io.fetchPdb('https://files.rcsb.org/download/' + pdb_id + '.pdb', function(structure) {
			showStructure(structure);
		});
	} else {
		setLabel("pdb_id=null");
		viewer.clear();
	}
}

function onPdbUrl(pdb_id) {
	if (!viewerReady) {
		return;
	}
	metaframe.debug('pdb_url=' + pdb_url);
	if (pdb_url != null) {
		setLabel("pdb_url=" + pdb_url);
		pv.io.fetchPdb(pdb_url, function(structure) {
			showStructure(structure);
		});
	} else {
		setLabel("pdb_url=null");
		viewer.clear();
	}
}


viewer.on('viewerReady', function() {
	viewerReady = true;

	viewer.on('viewpointChanged', function(cam) {
		metaframe.setOutputs({
			//Clone rotation because internally it uses the same object, so
			//equality checks fail
			"rotation": {value:Object.assign({}, viewer.rotation())},
			"zoom": {value:viewer.zoom()},
		});
	});

	viewer.addListener('click', function(picked) {
		if (picked === null) return;
		var target = picked.target();
		// if (target.qualifiedName !== undefined) {
		// 	console.log('clicked atom', target.qualifiedName(), 'on object', picked.node().name());
		// }
	});

	if (metaframe.getInput("pdb_data") != null) {
		onPdbData(metaframe.getInput("pdb_data"));
	} else if (metaframe.getInput("pdb_id") != null) {
		onPdbId(metaframe.getInput("pdb_id"));
	} else if (metaframe.getInput("pdb_url") != null) {
		onPdbUrl(metaframe.getInput("pdb_url"));
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
	if (!viewerReady) {
		return;
	}
	onPdbData(inputBlob.value);
});

metaframe.onInput("pdb_id", function(inputBlob) {
	if (!viewerReady) {
		return;
	}
	onPdbId(inputBlob.value);
});

metaframe.onInput("pdb_url", function(inputBlob) {
	if (!viewerReady) {
		return;
	}
	onPdbUrl(inputBlob.value);
});

metaframe.onInput("rotation", function(inputBlob) {
	if (!viewerReady) {
		return;
	}
	var rotation = inputBlob.value;
	metaframe.debug('rotation in=' + (rotation != null ? rotation : null) + ', viewerReady=' + viewerReady);
	if (rotation != null && typeof(rotation) == 'object') {
		metaframe.debug('SETTING ROTATION=' + rotation);
		viewer.setRotation(rotation);
	} else {
		metaframe.debug('rotation == null or !viewerReady');
	}
});

metaframe.onInput("zoom", function(inputBlob) {
	if (!viewerReady) {
		return;
	}
	var zoom = inputBlob.value;
	zoom = parseFloat(zoom + "");
	metaframe.debug('zoom in=' + (zoom != null ? zoom : null) + ', viewerReady=' + viewerReady);
	if (zoom != null && typeof(zoom) == 'number' && !isNaN(zoom)) {
		metaframe.debug('SETTING zoom=' + zoom);
		viewer.setZoom(zoom);
		viewer.setRotation(viewer.rotation());
	} else {
		metaframe.debug('zoom == null or !viewerReady');
	}
});

metaframe.onInputs(function(inputsBlob) {
	metaframe.debug("inputsBlob " + inputsBlob);
});

