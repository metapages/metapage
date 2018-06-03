---
---

var metapage = new Metapage({debug:false});

//Hard coding DCC for now
var metaframe = metapage.createIFrame('http://0.0.0.0:4000/metapage/metaframes/passthrough/');
var metaframeDiv = document.getElementById("iframe-wrapper");
// metaframeDiv.appendChild(metaframe.iframe);

new ResizeObserver(function outputsize() {
	document.getElementById('size-display').innerHTML = `Size: ${metaframe.iframe.offsetWidth}x${metaframe.iframe.offsetHeight}`;
}).observe(metaframeDiv)

