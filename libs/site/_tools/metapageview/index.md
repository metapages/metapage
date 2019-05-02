---
layout: vanilla
---

<head>
<script src="{{site.baseurl}}{{site.data.urls.axios_path}}"></script>
<script src="{{site.baseurl}}{{site.data.urls.jquery_path}}"></script>
<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.bootstrap_path}}">

{% include metapage_lib_script.html %}

<style>
	.vertical {
		display: flex;
		flex-direction: column;
	}
</style>

</head>

<body>

<h1>Metapage viewer</h1>
<br/>

<div class="form-group">
  <label for="metapagejson">Paste metapage JSON here:</label>
  <textarea class="form-control" rows="5" id="metapagejson"></textarea>
</div>

<div class="panel panel-default">
  <div class="panel-heading">
    <input class="btn btn-default" id="showMetapageButton" type="button" value="Show Metapage:">
      <!-- <h3 class="panel-title">Metapage:</h3> -->
  </div>
  <div class="vertical" id="metapage"></div>
</div>

</body>

<script src="index.js"></script>
