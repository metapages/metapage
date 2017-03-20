---
layout: vanilla
---
<style>
.column {
	display: flex;
	flex-direction: column;
}

.row {
	display: flex;
	flex-direction: row;
}

/* http://apps.eky.hk/css-triangle-generator/ */
.ArrowLeft {
	width: 0;
	height: 0;
	border-style: solid;
	border-width: 25px 0 25px 50px;
	border-color: transparent transparent transparent #007bff;
}
.ArrowRight {
	width: 0;
	height: 0;
	border-style: solid;
	border-width: 25px 50px 25px 0;
	border-color: transparent #007bff transparent transparent;
}
</style>

<script src="{{site.baseurl}}{{site.data.urls.metapage_library_path}}"></script>

<body>

These metaframes add a random letter to the input string then pass it back:

<br/>
<br/>

<div class="row">
	<div class="column" id="left">
	</div>
	<div class="column" id="middle">
		<div class="ArrowLeft"></div>
		<div class="ArrowRight"></div>
	</div>
	<div class="column" id="right">
	</div>
</div>

</body>
<script src="script1.js"></script>
<script src="script2.js"></script>
