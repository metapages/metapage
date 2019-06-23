$('#showMetapageButton').on('click', function (e) {
	var text = $('#metapagejson')[0].value;
	try {
		var metaPageDefinition = JSON.parse(text);
		var metapage = Metapage.from(metaPageDefinition);
		console.log(metapage);
		var metaframes = metapage.getMetaframes();
	  	for (var key in metaframes) {
	  		document.getElementById("metapage").appendChild(iframes[key].iframe);
	  	}
	} catch(err) {
		console.error("Failed to parse JSON", err);
	}
});