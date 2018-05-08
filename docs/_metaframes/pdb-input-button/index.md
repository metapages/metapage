---
layout: vanilla
---

<head>
<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>
<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.bootstrap_path}}">
</head>
<body>
<a href="#" class="btn btn-primary" type="button" onclick="document.getElementById('input').click(); return false;">Upload PDB (Protein Data Bank) file</a> <input id="input" type="file" style="visibility: hidden; display: none;" />

<div class="form-group">
  <label for="pdbid">PDB Id:</label>
  <input type="text" class="form-control" id="pdbid"/>
</div>

</body>
<script src="{{site.baseurl}}{{site.data.urls-internal.metaframe_library_path}}"></script>
<script src="index.js"></script>
