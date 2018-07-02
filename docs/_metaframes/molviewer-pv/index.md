---
layout: vanilla
---

<head>
    <title>Javascript Protein Viewer</title>
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>
</head>
<body>
	<div id="label">Waiting for data</div>
	<div id="viewer"></div>
    <div>
    	<a href="https://biasmv.github.io/pv/">Javascript Protein Viewer</a>
    </div>
</body>
{% include metaframe_lib_script.html %}
<script src="bio-pv.min.js"></script>
<script src="index.js"></script>
