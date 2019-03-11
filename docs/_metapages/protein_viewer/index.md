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
{% include metapage_lib_script.html %}
<script src="{{site.baseurl}}{{site.data.urls.axios_path}}"></script>
<script>
fetch('metapage.json')
  	.then((response) => {
		return response.json();
	})
	.then(function (metaPageDefinition) {
  	var mp = metapage.Metapage.fromDefinition(metaPageDefinition);
  	var iframes = mp.get_iframes();

  	for (var key in iframes) {
      var parent = document.getElementById("_" + key);
      if (parent) {
        parent.appendChild(iframes[key]);
      } else {
        parent = document.getElementById("body");
        var div = document.createElement("div");
        div.appendChild(iframes[key]);
        parent.appendChild(div);
      }
  	}

  })
  .catch(function (error) {
    console.error(error);
  });
</script>
