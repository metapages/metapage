axios.get('metapage.json')
  .then(function (response) {
  	var metaPageDefinition = response.data;
    var domain = location.protocol + "//" + location.hostname + ":4040";
    metaPageDefinition.iframes.converter.url = metaPageDefinition.iframes.converter.url.replace('ccc.bionano.autodesk.com', domain);
  	var metapage = Metapage.fromDefinition(metaPageDefinition);
  	var iframes = metapage.get_iframes();

    for (var key in iframes) {
      var parent = document.getElementById(key);
      if (parent != null) {
        parent.appendChild(iframes[key]);
      } else {
        metapage.error('Cannot find parent for ' + key);
        window.document.body.appendChild(iframes[key]);
      }
    }
  	// console.log('iframes', iframes);
  	// for (var key in iframes) {
  	// 	window.document.body.appendChild(iframes[key]);
  	// }

  })
  .catch(function (error) {
    console.error(error);
  });
