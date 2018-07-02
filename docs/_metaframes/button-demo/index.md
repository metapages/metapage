---
layout: vanilla
---
<head>
	<style>
		html { height: 100%; }
		body { min-height: 100%; }
	</style>
	<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>
</head>
<body>
	<!-- <link rel="stylesheet" href="pure-min.css"> -->
    {% include metaframe_lib_script.html %}
	Har har har
	<div id="content">
    	<button id="button1" class="pure-button">Add Category1</button>
    	<button id="button2" class="pure-button">Add Category2</button>
    	<button id="button3" class="pure-button">Add Category3</button>
	</div>
	<script src="index.js"></script>
</body>
