---
---

var metapage = new Metapage({debug:false});
var metaframe;

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


var lastWidth = document.getElementById('iframe-wrapper').offsetWidth;
var metaframeDiv = document.getElementById("iframe-wrapper");

function outputsize() {
	if (lastWidth && document.getElementById('iframe-wrapper').offsetWidth != lastWidth) {
		document.getElementById('helper-text').innerHTML = null;
		lastWidth = null;
	}
	if (metaframe) {
		document.getElementById('size-display').innerHTML = `Size: ${metaframe.iframe.offsetWidth}x${metaframe.iframe.offsetHeight}`;
	}
}
new ResizeObserver(outputsize).observe(metaframeDiv);


if (urlParams && urlParams.url) {
	//Hard coding DCC for now
	metaframe = metapage.createIFrame(urlParams.url);
	metaframeDiv.appendChild(metaframe.iframe);
} else {
	var fullUrl = `${window.location.href}?url=${window.location.origin}/metapage/metaframes/passthrough/`;
	console.log(fullUrl);
	document.getElementById('iframe-wrapper').innerHTML = `Append metaframe url: <a href="${fullUrl}">${fullUrl}</a>`;
}
// http://0.0.0.0:4000/metapage/metaframes/passthrough/