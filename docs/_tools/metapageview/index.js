$('#showMetapageButton').on('click', function (e) {
	var text = $('#metapagejson')[0].value;
	try {
		var metaPageDefinition = JSON.parse(text);
		console.log(metaPageDefinition);

		var mp = metapage.Metapage.fromDefinition(metaPageDefinition);
	  	var iframes = mp.get_iframes();

	  	for (var key in iframes) {
	  		document.getElementById("metapage").appendChild(iframes[key]);
	  	}
	} catch(err) {
		console.error("Failed to parse JSON", err);
	}
});