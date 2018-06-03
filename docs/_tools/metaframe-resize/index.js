---
---

var metapage = new Metapage({debug:false});


var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();
console.log(urlParams);

if (urlParams && urlParams.url) {
	//Hard coding DCC for now
	var metaframe = metapage.createIFrame(urlParams.url);
	var metaframeDiv = document.getElementById("iframe-wrapper");
	metaframeDiv.appendChild(metaframe.iframe);

	new ResizeObserver(function outputsize() {
		document.getElementById('size-display').innerHTML = `Size: ${metaframe.iframe.offsetWidth}x${metaframe.iframe.offsetHeight}`;
	}).observe(metaframeDiv);
}



