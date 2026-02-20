fetch('metapage.json')
  .then((response) => {
    return response.json();
  })
  .then((metaPageDefinition) => {
  	var mp = Metapage.from(metaPageDefinition);
  	var iframes = mp.iframes();

  	for (var key in iframes) {
      var parent = document.getElementById(key);
      if (parent != null) {
        parent.appendChild(iframes[key]);
      } else {
        mp.error('Cannot find parent for ' + key);
        window.document.body.appendChild(iframes[key]);
      }
  	}

  })
  .catch(function (error) {
    console.error(error);
  });
