---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

## Metapages

|:--------------------|:-----------------------|:------------------------|
{%- for metapage in site.metapages -%}
	{%- if metapage.url contains 'index.html' -%}
		{%- assign tokens = metapage.url | remove: "/index.html" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- if jekyll.environment == "production" -%}
			{%- assign url = "https://app.metapages.org/#url=" | append: site.url | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- else -%}
			{%- assign url = site.data.urls.app-metapage-local | append: "#url=" | append: site.url | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- endif -%}
		{%- if token == "test" -%}
			{%- assign url = site.baseurl | append: "/metapages/" | append: token -%}
		{%- endif -%}
		{%- assign urlJson = site.url | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- assign urlDebug = url | append: "?DEBUG" %}
| [{{ token }}]({{ url }})  | [debug]({{ urlDebug }}) | [Metapage JSON definition]({{ urlJson }}) |
	{%- endif -%}
{% endfor %}


## Metaframes

|:--------------------|:-----------------------|:------------------------|
{%- for metaframe in site.metaframes -%}
	{%- if metaframe.url contains 'index.html' -%}
		{%- assign index = metaframe.url | remove: "index.html" -%}
		{%- assign tokens = metaframe.url | remove: "/index.html" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- assign urlJson = index | append: "metaframe.json" -%}
		{%- assign inspect = site.url | append: "/tools/metaframeview?url=" | append: site.url | append: "/metaframes/" | append: token | append: "/" %}
| [{{ token }}]({{ index }}) | [Inspect]({{ inspect }})  | [JSON Definition]({{ urlJson }}) |
	{%- endif -%}
{% endfor %}


<!-- | [{{ metaframe.url }}]({{ metaframe.url }}) | test1  | test2 | -->
<!-- {%- if metaframe.url contains 'metaframe.json' -%}
		{%- assign index = metaframe.url | remove: "metaframe.json" -%}
		{%- assign tokens = metaframe.url | remove: "/metaframe.json" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- assign inspect = site.url | append: "/tools/metaframeview?url=" | append: index %}
| [{{ token }}]({{ index }}) | [Test/Play]({{ inspect }})  | [metaframe.json]({{ metaframe.url }}) |
	{%- endif -%} -->




Metapages:
<ul id="metapages"></ul>

Metaframes:
<ul id="metaframes"></ul>

Plugins:
<ul id="plugins"></ul>

Tools:
<ul id="tools"></ul>

