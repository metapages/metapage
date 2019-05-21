---
layout: vanilla
---
<head></head>
<body>
	<div id="input-button" ></div>
	<table border="0">
		<tr>
			<td id="viewer1"></td>
			<td id="passthrough2"></td>
			<td id="viewer2"></td>
		</tr>
		<tr>
			<td ></td>
			<td id="passthrough1"></td>
			<td id="viewer3"></td>
		</tr>
	</table>
</body>
{% include metapage_lib_script.html %}
<script>
fetch('metapage.json')
  .then((response) => {
    return response.json();
  })
  .then((metaPageDefinition) => {
  	var mp = Metapage.from(metaPageDefinition);
  	var iframes = mp.iframes();

  	for (var key in iframes) {
      var parent = document.getElementById(key);
      if (parent != null) {
        parent.appendChild(iframes[key]);
      } else {
        mp.error('Cannot find parent for ' + key);
        window.document.body.appendChild(iframes[key]);
      }
  	}

  })
  .catch(function (error) {
    console.error(error);
  });
</script>
