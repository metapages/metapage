fetch('metapage.json')
  .then((response) => {
		return response.json();
	})
	.then((metaPageDefinition) => {
  	var mp = metapage.Metapage.fromDefinition(metaPageDefinition);
  	var iframes = mp.get_iframes();

  	for (var key in iframes) {
			if (window.document.getElementById(key) != null) {
				window.document.getElementById(key).appendChild(iframes[key]);
			} else {
				window.document.body.appendChild(iframes[key]);
			}
  		
  	}
  })
  .catch(function (error) {
    console.error(error);
  });
