//localstorage wrapper
window.store = {
    localStoreSupport: function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    },
    set: function(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else {
            var expires = "";
        }
        if( this.localStoreSupport() ) {
            localStorage.setItem(name, value);
        }
    },
    get: function(name) {
        if( this.localStoreSupport() ) {
            var ret = localStorage.getItem(name);
            //console.log(typeof ret);
            switch (ret) {
              case 'true':
                  return true;
              case 'false':
                  return false;
              default:
                  return ret;
            }
        }
    },
    del: function(name) {
        if( this.localStoreSupport() ) {
            localStorage.removeItem(name);
        }
    },
}


/* Set up the metaframe channel */
var connection = new metapage.Metaframe();

var inputElement = document.getElementById("input");
function handleFiles() {
  var fileList = this.files; /* now you can work with the file list */
  var file = fileList[0];

  var reader = new FileReader();
	reader.onload = function(e) {
		var text = reader.result;
		connection.setOutput("pdb_data", text);
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
				connection.setOutput("pdb_id", pdbId);
				connection.setInput("pdb_id", pdbId);
				return response.text();
			} else {
				connection.log(response);
				connection.setOutput("pdb_data", null);
				return null;
			}
		})
		.then(function(pdb_data) {
			if (pdb_data != null) {
				connection.setOutput("pdb_data", pdb_data);
				//Cache locally for when we're offline
				store.set(pdbId, pdb_data);
			}
		})
		.catch(function (error) {
			connection.error(error);
			var cachedValue = store.get(pdbId);
			if (cachedValue) {
				connection.setOutput("pdb_data", cachedValue);
			} else {
				connection.setOutput("pdb_data", null);
			}
		});
}

document.getElementById('pdbid').addEventListener('keypress', function (e) {
	var key = e.which || e.keyCode;
	if (key === 13) { // 13 is enter
		sendPdbId();
	}
});

connection.connected().then(function() {
	if (connection.getInputs() && connection.getInputs()['pdb_id']) {
		document.getElementById('pdbid').value = connection.getInputs()['pdb_id'];
	} else {
		document.getElementById('pdbid').value = "1C7D";
	}
	sendPdbId();
}, function(err) {
	console.error('Error setting up the metaframe connection');
});
