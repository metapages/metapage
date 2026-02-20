function createMetaframeOrPlugin(metaframeId, metaframe, element) {
	const row = document.createElement("div");
	row.className = "siimple-grid-row";
	// row.style = "max-height:500px";

	const col = document.createElement("div");
	col.className = "siimple-grid-col siimple-grid-col--10";
	row.appendChild(col);

	const container = document.createElement("div");
	container.className = "siimple-card";
	container.style = "max-height:500px; width:100%";
	col.appendChild(container);
	
	const title = document.createElement("div");
	title.className = "siimple-card-header";
	title.innerHTML = `<a href="${metaframe.url}">${metaframeId}</a>`;
	container.appendChild(title);

	const cardBody = document.createElement("div");
	cardBody.className = "siimple-card-body";
	container.appendChild(cardBody);

	const iframeContainer = document.createElement("div");
	iframeContainer.className = "iframe-container";
	iframeContainer.style = "max-height:500px;";
	cardBody.appendChild(iframeContainer);

	iframeContainer.appendChild(metaframe.iframe);
	
	element.appendChild(row);
}

$('#showMetapageButton').on('click', function (e) {
	var text = $('#metapagejson')[0].value;
	try {
		window.metaPageDefinition = JSON.parse(text);
		console.log('metaPageDefinition', metaPageDefinition);
		window.metapage = Metapage.from(metaPageDefinition);
		window.metapage.setDebugFromUrlParams();
		window.metapage.debug = true;
		console.log(metapage);

		window.metapage.on('definition', () => {
			["metaframes", "plugins"].forEach((root) => {
				const el = document.getElementById(root);
				while (el.firstChild) {
					el.removeChild(el.firstChild);
				}
			});
			
			window.metaframes = metapage.metaframes();
			Object.keys(window.metaframes).forEach((metaframeId) => {
				const metaframe = metapage.getMetaframe(metaframeId);
				createMetaframeOrPlugin(metaframeId, metaframe, document.getElementById("metaframes"));
			});

			metapage.getPluginIds().forEach((metaframeId) => {
				const metaframe = metapage.getPlugin(metaframeId);
				createMetaframeOrPlugin(metaframeId, metaframe, document.getElementById("plugins"));
			});
		});

		

	} catch(err) {
		console.error("Failed to parse JSON", err);
	}
});