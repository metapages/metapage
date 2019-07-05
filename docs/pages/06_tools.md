---
layout: default
title: Tools
permalink: /tools/
nav_order: 6
has_children: false
has_toc: false
---

<ul id="tools-metapage">
{% if jekyll.environment == "production" %}
	<li><a href="https://app.metapages.org">Metapage Viewer</a></li>
{% else %}
	<li><a href="{{site.data.urls.app-metapage-local}}">Metapage Viewer</a></li>
	<li><a href="{{site.baseurl}}/tools/metapageview">Old Metapage Viewer (obsolete)</a></li>
{% endif %}
</ul>

<ul id="tools-metaframe">
	<li><a href="{{site.baseurl}}/tools/metaframeview?url={{site.url}}/metaframes/random-data-generator/">Metaframe Viewer</a></li>
	<li><a href="{{site.baseurl}}/tools/metaframe-resize?url={{site.url}}/metaframes/random-data-generator/">Metaframe Resizer</a></li>
</ul>
