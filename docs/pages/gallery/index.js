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
	e = "{{site.url}}" + tokens.join('/');
	if (!metaframes[token]) {
		metaframes[token] = true;
		var element = document.createElement("li");
		element.innerHTML = '<a href="' + e + '/">' + token + '</a>  <a href="{{site.url}}/tools/metaframeview?url=' + e + '/">inspect</a>';
		document.getElementById("metaframes").appendChild(element);
	}
});

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