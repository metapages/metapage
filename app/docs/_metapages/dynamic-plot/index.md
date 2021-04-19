---
---

<html>
<head>
	<style>
		html, body { height: 100% }

		.iframe-container {
			overflow: hidden;
			padding-top: 100%;
			position: relative;
		}

		.iframe-container iframe {
			border: 1px solid red;
			height: 100%;
			left: 0;
			position: absolute;
			top: 0;
			width: 100%;
		}
		</style>
	<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.minicss}}" />
    {% include metapage_lib_script.html %}
</head>

<body>

<div class="container">
    <div class="row">
        <div class="col-sm-2">
            <div id="random-data-generator" class="iframe-container iframe"></div>
        </div>
        <div class="col-sm-10">
            <div id="graph-dynamic" class="iframe-container iframe"></div>
        </div>
    </div>
    <div class="row">
    </div>
</div>


<script>
(async () => {
	await Metapage.load();
})()
</script>
</body>
</html>
