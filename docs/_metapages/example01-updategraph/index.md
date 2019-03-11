---
layout: vanilla
---

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
		/* .iframe {
			height: 200px;
			max-height: 200px;
		} */
		</style>
	<!-- <link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.bootstrap_path}}"> -->
	<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.minicss}}" />
</head>

<body>
	
	<div class="container">
		<div class="row">
			<div class="col-sm-2">
				<div id="button" class="iframe-container iframe"></div>
			</div>
			<div class="col-sm-10">
				<div id="graph" class="iframe-container iframe"></div>
			</div>
		</div>
		<div class="row">
			
		</div>
	</div>
	
	{% include metapage_lib_script.html %}
	<script src="index.js"></script>
</body>



