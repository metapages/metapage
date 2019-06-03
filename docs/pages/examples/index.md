---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

Metaframes:
<ul id="metaframes"></ul>

Plugins:
<ul id="plugins"></ul>

Metapages:
<ul id="metapages"></ul>

Tools:
<ul id="tools"></ul>

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
var plugins = {};

// add the locally hosted metaframe links
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


// add the metaframes hosted elsewhere
[
	"https://metapages.github.io/metaframe-editor-json/",
	"http://localhost:8080/ui/plots/metaframe-experiences/",
].map((url) => {
{% if jekyll.environment == "production" %}
		return url;
{% else %}
		return `http://localhost:3000/${url}`;
{% endif %}
}).map((url => {
	var element = document.createElement("li");
	element.innerHTML = `<a href="${url}">${url}</a>  <a href="{{site.url}}/tools/metaframeview?url=${url}">inspect</a>`;
	document.getElementById("metaframes").appendChild(element);
}));

// add the locally hosted plugins
[
	{% for metaframe in site.plugins %}
	  "{{site.baseurl}}{{ metaframe.id }}".replace('/index', ''),
	{% endfor %}
].forEach(function(e) {
	var token = getFirstTokenAfter(e, 'plugins');
	var tokens = e.split('/');
	var i = tokens.indexOf(token);
	tokens = tokens.slice(0, i + 1);
	e = "{{site.url}}" + tokens.join('/');
	if (!plugins[token]) {
		plugins[token] = true;
		var element = document.createElement("li");
		element.innerHTML = '<a href="' + e + '/">' + token + '</a>  <a href="{{site.url}}/tools/metaframeview?url=' + e + '/">inspect</a>';
		document.getElementById("plugins").appendChild(element);
	}
});

// add the local metapages
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
			`{{site.data.urls.app-metapage-local}}/#url={{site.url}}/metapages/${token}/`;
{% endif %}

		if (token == 'test') {
			// don't wrap the test metapage in app.metapages.org it will break
			metapageViewUrl = `{{site.baseurl}}/metapages/${token}/`;
		}

		element.innerHTML = '<a href="' + metapageViewUrl + '">' + e.split('/').pop() + `</a>  <a href="{{site.baseurl}}/metapages/${token}/metapage.json">metapage.json</a> <a href="{{site.baseurl}}/metapages/${token}/?MP_DEBUG=1">debug</a>`;
		document.getElementById("metapages").appendChild(element);
	}
});

// add the tools hosted elsewhere
[
	"https://app.metapages.org/",
].map((url) => {
{% if jekyll.environment == "production" %}
		return url;
{% else %}
		return `http://localhost:3000/${url}`;
{% endif %}
}).map((url => {
	var element = document.createElement("li");
	element.innerHTML = `<a href="${url}">${url}</a>`;
	document.getElementById("tools").appendChild(element);
}));

</script>
