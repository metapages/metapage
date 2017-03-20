axios.get('metapage.json')
  .then(function (response) {
  	var metaPageDefinition = response.data;
  	var metapage = Metapage.fromDefinition(metaPageDefinition);
  	var iframes = metapage.get_iframes();

  	for (var key in iframes) {
      var parent = document.getElementById("_" + key);
      if (parent) {
        parent.appendChild(iframes[key]);
      } else {
        parent = document.getElementById("body");
        var div = document.createElement("div");
        div.appendChild(iframes[key]);
        parent.appendChild(div);
      }
  	}

  })
  .catch(function (error) {
    console.error(error);
  });

// avirshup/mst:workflows-0.0.alpha5

// ["minimize", "--preprocess", "/inputs/input.pdb", "--outputdir", "/outputs/"]

// input.pdb {"input": "C"}
