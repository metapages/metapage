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
var viewerReadyPromise = new Promise(function(resolve, reject) {
  viewer.on('viewerReady', function() {
  	viewerReady = true;
  	resolve(true);
  });
});

var hasStructure = false;
var cameraIn = null;

/**
 * We send the last zoom coord to inputs (with a special name)
 * as a way of saving position between sessions.
 */
var ZOOM_INPUT_INTERNAL = 'internal:zoom';
var ROTATION_INPUT_INTERNAL = 'internal:rotation';
var incomingExternalCoords = false;
var initialState = null;

function setLabel(text) {
	document.getElementById("label").innerHTML = text;
}

setLabel("Waiting for data...");


function showStructure(structure) {
	hasStructure = true;
	viewer.clear();
	viewer.cartoon('protein', structure, { color : color.ssSuccession() });
  	viewer.centerOn(structure);
  	if (initialState) {
  		if (initialState.zoom) {
  			setZoomFromValue(initialState.zoom);
  		}
  		if (initialState.rotation) {
  			setRotationFromValue(initialState.rotation);
  		}
  		initialState = null;
  	}
}

function onPdbData(pdb_data) {
	if (!viewerReady) {
		return;
	}
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
	if (pdb_id && viewerReady && typeof(pdb_id) === 'string') {
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

function setZoomFromValue(zoom) {
	zoom = parseFloat(zoom + "");
	if (zoom != null && typeof(zoom) == 'number' && !isNaN(zoom)) {
		viewer.setZoom(zoom);
		viewer.setRotation(viewer.rotation());
	}
}

function setRotationFromValue(rotation) {
	if (rotation != null && typeof(rotation) === 'object') {
		rotation = new Float32Array(rotation);
		viewer.setRotation(rotation);
	}
}

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
	incomingExternalCoords = true;
	if (!viewerReady) {
		return;
	}
	var rotation = inputBlob.value;
	if (rotation != null && typeof(rotation) === 'object') {
		setRotationFromValue(rotation);
	} else {
		metaframe.debug('rotation == null or !viewerReady');
	}
});

metaframe.onInput("zoom", function(inputBlob) {
	incomingExternalCoords = true;
	if (!viewerReady) {
		return;
	}
	setZoomFromValue(inputBlob.value);
});

/* Set up the metaframe channel */
metaframe.ready
	.then(function() {
		if (metaframe.getInput(ZOOM_INPUT_INTERNAL)
			&& metaframe.getInput(ZOOM_INPUT_INTERNAL).value
			&& metaframe.getInput(ROTATION_INPUT_INTERNAL)
			&& metaframe.getInput(ROTATION_INPUT_INTERNAL).value) {

			// initialZoom = metaframe.getInput(ZOOM_INPUT_INTERNAL).value;
			// initialRotation = metaframe.getInput(ROTATION_INPUT_INTERNAL).value;
			initialState = {
				zoom: metaframe.getInput(ZOOM_INPUT_INTERNAL).value,
				rotation: metaframe.getInput(ROTATION_INPUT_INTERNAL).value,
			};
		}


		metaframe.debug('READY');
		metaframe.sendDimensions({width:width,height:height});
	}, function(err) {
		metaframe.error('molviewer: Error setting up the metaframe connection error=' + JSON.stringify(err));
	})
	.then(function() {
		return viewerReadyPromise;
	})
	.then(function() {
		//The view is ready and the metaframe connection is ready
		viewer.on('viewpointChanged', function(cam) {
			var rotationArray = Array.prototype.slice.call(viewer.rotation());
			var newRotationBlob = {value:rotationArray};
			var newZoomBlob = {value:viewer.zoom()};
			metaframe.setOutputs({
				//Clone rotation because internally it uses the same object, so
				//equality checks fail
				"rotation": newRotationBlob,
				"zoom": newZoomBlob,
			});

			if (!incomingExternalCoords) {
				//Internal values for restoring
				var inputs = {};
				inputs[ZOOM_INPUT_INTERNAL] = newZoomBlob;
				inputs[ROTATION_INPUT_INTERNAL] = newRotationBlob;
				metaframe.setInputs(inputs);
			}
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
			if (metaframe.getInput("pdb_id") != null) {
				setLabel("pdb_id=" + metaframe.getInput("pdb_id").value);
			}
		} else if (metaframe.getInput("pdb_id") != null) {
			onPdbId(metaframe.getInput("pdb_id"));
		} else if (metaframe.getInput("pdb_url") != null) {
			onPdbUrl(metaframe.getInput("pdb_url"));
		}
	});