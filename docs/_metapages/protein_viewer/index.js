axios.get('metapage.json')
  .then(function (response) {
  	var metaPageDefinition = response.data;
  	var mp = metapage.Metapage.fromDefinition(metaPageDefinition);
  	var iframes = mp.get_iframes();

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
