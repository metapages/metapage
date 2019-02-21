$('#showMetapageButton').on('click', function (e) {
	var text = $('#metapagejson')[0].value;
	try {
		var metaPageDefinition = JSON.parse(text);

		var metapage = metapage.Metapage.fromDefinition(metaPageDefinition);
	  	var iframes = metapage.get_iframes();

	  	for (var key in iframes) {
	  		document.getElementById("metapage").appendChild(iframes[key]);
	  	}
	} catch(err) {
		console.error("Failed to parse JSON", err);
	}
});