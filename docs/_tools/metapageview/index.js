$('#showMetapageButton').on('click', function (e) {
	var text = $('#metapagejson')[0].value;
	try {
		var metaPageDefinition = JSON.parse(text);
		var metapage = Metapage.from(metaPageDefinition);
		var iframes = metapage.iframes();
	  	for (var key in iframes) {
	  		document.getElementById("metapage").appendChild(iframes[key]);
	  	}
	} catch(err) {
		console.error("Failed to parse JSON", err);
	}
});