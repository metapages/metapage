---
layout: vanilla
---

<head>
<style>

	iframe{width:100%}
	/*body { min-height: 100%; }*/
</style>
</head>
<body>
	<div>
		<div id="_input-button"></div>
		<div id="viewers" style="overflow: hidden; position: relative;">
			<div id="_viewer1" style="float: left;"></div>
			<div id="_viewer2" style="float: left;"></div>
		</div>
		<div id="_pdb-to-uniprot"></div>
		<div id="_protvista"></div>
	</div>
</body>
<script src="{{site.baseurl}}{{site.data.urls.metapage_library_path}}"></script>
<script src="{{site.baseurl}}{{site.data.urls.axios_path}}"></script>
<script src="index.js"></script>
