---
layout: vanilla
---

<head>
<link rel="stylesheet" href="{{site.data.urls.bulma}}">
<link rel="stylesheet" href="css/styles.css">

<script src="{{site.baseurl}}{{site.data.urls-internal.metapage_library_path}}"></script>
</head>

<body>

<div class="horizontal">
	<h1 id="title">Metaframe resizer</h1>
	<h1 id="size-display">Size:</h1>
</div>

<div class="iframe-wrapper-container" >
	<div id="iframe-wrapper" class="iframe-wrapper" ></div>
</div>

<div  class="horizontal-reverse" >
	<div id="resize-here">
		<span id="helper-text" class="has-text-info is-size-7">Resize here ▲</span>
	</div>
</div>


</body>

<script src="index.js"></script>
