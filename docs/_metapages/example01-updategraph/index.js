axios.get('metapage.json')
  .then(function (response) {
  	var metaPageDefinition = response.data;
  	var mp = metapage.Metapage.fromDefinition(metaPageDefinition);
  	var iframes = mp.get_iframes();

  	console.log('iframes', iframes);
  	for (var key in iframes) {
  		window.document.body.appendChild(iframes[key]);
  	}

  })
  .catch(function (error) {
    console.error(error);
  });
