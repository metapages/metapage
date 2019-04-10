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

{% include metapage_lib_script.html %}

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
<script>
var connectionManager = new Metapage();

var url1 = '{{site.baseurl}}/metaframes/example00_iframe1/';
var iframe1 = connectionManager.addMetaframe(url1, 'iframe1');
document.getElementById("left").appendChild(iframe1.iframe);

var url2 = '{{site.baseurl}}/metaframes/example00_iframe2/';
var iframe2 = connectionManager.addMetaframe(url2, 'iframe2');
document.getElementById("right").appendChild(iframe2.iframe);

connectionManager.addPipe(iframe2.id, {metaframe:iframe1.id, source:'fooOut', target:'fooIn'});
connectionManager.addPipe(iframe1.id, {metaframe:iframe2.id, source:'barOut', target:'barIn'});

var a1 = document.createElement('a');
a1.setAttribute('href', url1);
a1.innerHTML = 'Go to metaframe';
document.getElementById("left").appendChild(a1);

var a2 = document.createElement('a');
var urlInspect = '{{site.baseurl}}/tools/metaframeview?url=' + url1;
a2.setAttribute('href', urlInspect);
a2.innerHTML = 'Inspect metaframe';
document.getElementById("left").appendChild(a2);

var b1 = document.createElement('a');
b1.setAttribute('href', url2);
b1.innerHTML = 'Go to metaframe';
document.getElementById("right").appendChild(b1);

var b2 = document.createElement('a');
var urlInspect = '{{site.baseurl}}/tools/metaframeview?url=' + url2;
b2.setAttribute('href', urlInspect);
b2.innerHTML = 'Inspect metaframe';
document.getElementById("right").appendChild(b2);
</script>
