---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

Metaframes:
<ul id="metaframes"></ul>


Metapages:
<ul id="metapages"></ul>


<script>

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
		// Link to the metapage, metapage.json, metapage in debug mode
		var element = document.createElement("li");

		var metapageViewUrl = 
{% if jekyll.environment == "production" %}
			`https://app.metapages.org/#url={{site.url}}/metapages/${token}/`;
{% else %}
			`http://localhost:4010/#url={{site.url}}/metapages/${token}/`;
{% endif %}

		if (token == 'test') {
			// don't wrap the test metapage in app.metapages.org it will break
			metapageViewUrl = `{{site.baseurl}}/metapages/${token}/`;
		}

		element.innerHTML = '<a href="' + metapageViewUrl + '">' + e.split('/').pop() + `</a>  <a href="{{site.baseurl}}/metapages/${token}/metapage.json">metapage.json</a> <a href="{{site.baseurl}}/metapages/${token}/?MP_DEBUG=1">debug</a>`;
		document.getElementById("metapages").appendChild(element);
	}
});

</script>
