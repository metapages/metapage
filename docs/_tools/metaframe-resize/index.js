---
---

var urlObject = new URL(window.location.href);
var urlParam = urlObject.searchParams.get('url');
var debugParam = urlObject.searchParams.get('debug') == '1' || urlObject.searchParams.get('debug') == 'true';

var mp = new metapage.Metapage({debug:debugParam});
var metaframe;

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


if (urlParam) {
	metaframe = mp.createIFrame(urlParam);
	metaframeDiv.appendChild(metaframe.iframe);
} else {
	var fullUrl = `${window.location.href}?url=${window.location.origin}/metapage/metaframes/passthrough/`;
	console.log(fullUrl);
	document.getElementById('iframe-wrapper').innerHTML = `Append metaframe url: <a href="${fullUrl}">${fullUrl}</a>`;
}
