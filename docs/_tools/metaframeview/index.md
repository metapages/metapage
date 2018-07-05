---
layout: vanilla
---

<head>
<link rel="stylesheet" href="{{site.data.urls.bulma}}">
<link rel="stylesheet" href="css/styles.css">

{% include metapage_lib_script.html %}
</head>

<body>

<h1>Metaframe editor</h1>

<div id="url" >
</div>
<div class="horizontal" >
	<div class="column-inputs-outputs" id="container-inputs" ></div>
	<div class="column-metaframe"      id="container-metaframe" ></div>
	<div class="column-inputs-outputs" id="container-outputs" ></div>
</div>

</body>

<script src="index.js"></script>
