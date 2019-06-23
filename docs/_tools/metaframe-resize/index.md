---
layout: vanilla
---

<head>
<link rel="stylesheet" href="{{site.data.urls.bulma}}">
<link rel="stylesheet" href="css/styles.css">
{% include metapage_lib_script.html %}
</head>

<body>

<div class="horizontal">
	<h1 id="title">Metaframe resizer</h1>
	<h1 id="size-display">Size:</h1>
</div>

<div class="iframe-wrapper-container" >
	<div id="iframe-wrapper" class="iframe-wrapper" ></div>
</div>

<div  class="horizontal-reverse" >
	<div id="resize-here">
		<span id="helper-text" class="has-text-info is-size-7">Resize here ▲</span>
	</div>
</div>


</body>

<script>
var urlObject = new URL(window.location.href);
var urlParam = urlObject.searchParams.get('url');

var mp = new Metapage();
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
	metaframe = mp.addMetaframe(urlParam);
	metaframeDiv.appendChild(metaframe.iframe);
} else {
	var fullUrl = `${window.location.href}?url=${window.location.origin}/metapage/metaframes/passthrough/`;
	console.log(fullUrl);
	document.getElementById('iframe-wrapper').innerHTML = `Append metaframe url: <a href="${fullUrl}">${fullUrl}</a>`;
}

</script>
