---
---

<html>
<head>
<link rel="stylesheet" href="{{site.baseurl}}{{site.data.urls.bootstrap_path}}">
</head>
<body>
<a href="#" class="btn btn-primary" type="button" onclick="document.getElementById('input').click(); return false;">Upload PDB (Protein Data Bank) file</a> <input id="input" type="file" style="visibility: hidden; display: none;" />

<div class="form-group">
  <label for="pdbid">PDB Id:</label>
  <input type="text" class="form-control" id="pdbid"/>
</div>
<div>
1BNA 5C0T 5C0U 1c7d
</div>

</body>
{% include metaframe_lib_script.html %}
<script src="index.js"></script>
</html>
