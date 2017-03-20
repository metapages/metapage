---
permalink: /gallery/index.js
---

function getFirstTokenAfter(s, target) {
	var tokens = s.split('/');
	var index = tokens.indexOf(target);
	if (index > -1) {
		return tokens[index + 1];
	} else {
		return null;
	}
}

var metaframes = {};
var metapages = {};

[
	{% for metaframe in site.metaframes %}
	  "{{site.baseurl}}{{ metaframe.id }}".replace('/index', ''),
	{% endfor %}
].forEach(function(e) {
	var token = getFirstTokenAfter(e, 'metaframes');
	var tokens = e.split('/');
	var i = tokens.indexOf(token);
	tokens = tokens.slice(0, i + 1);
	e = tokens.join('/');
	if (!metaframes[token]) {
		metaframes[token] = true;
		var element = document.createElement("li");
		element.innerHTML = '<a href="' + e + '/">' + token + '</a>  <a href="{{site.baseurl}}/tools/metaframeview?url=' + e + '/">inspect</a>';
		document.getElementById("metaframes").appendChild(element);
	}
});

var elementCCC = document.createElement("li");
elementCCC.innerHTML = '<a href="http://ccc.bionano.autodesk.com:9000/metaframe/">Cloud Compute Cannon</a>  <a href="{{site.baseurl}}/tools/metaframeview?url=http://ccc.bionano.autodesk.com:9000/metaframe/">inspect</a>';
document.getElementById("metaframes").appendChild(elementCCC);

var elementViewer = document.createElement("li");
elementViewer.innerHTML = '<a href="http://localhost:8000">Bionano Molecular Viewer</a>  <a href="{{site.baseurl}}/tools/metaframeview?url=http://localhost:8000/">inspect</a>';
document.getElementById("metaframes").appendChild(elementViewer);



[
	{% for metapage in site.metapages %}
	  "{{site.baseurl}}{{ metapage.id }}".replace('/index', ''),
	{% endfor %}
].forEach(function(e) {
	var token = getFirstTokenAfter(e, 'metapages');
	var tokens = e.split('/');
	var i = tokens.indexOf(token);
	tokens = tokens.slice(0, i + 1);
	e = tokens.join('/');
	if (!metapages[token]) {
		metapages[token] = true;
		var element = document.createElement("li");
		element.innerHTML = '<a href="' + e + '/">' + e.split('/').pop() + '</a>  <a href="{{site.baseurl}}/metapages/' + token + '/metapage.json">metapage.json</a>';
		document.getElementById("metapages").appendChild(element);
	}
});