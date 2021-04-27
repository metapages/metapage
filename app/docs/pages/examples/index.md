---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

## Example Metapages

|:--------------------|:-----------------------|:------------------------|
{%- for metapage in site.metapages -%}

	{%- if metapage.url contains 'index.html' -%}
		{%- assign tokens = metapage.url | remove: "/index.html" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- if jekyll.environment == "production" -%}
			{%- assign url = "https://app.metapages.org/#?url=" | append: site.url | append: site.baseurl | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- else -%}
			{%- assign url = site.data.urls.app-metapage-local | append: "#?url=" | append: site.url | append: site.baseurl | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- endif -%}
		{%- if token == "test" -%}
			{%- assign url = site.baseurl | append: "/metapages/" | append: token -%}
		{%- endif -%}
		{%- assign urlJson = site.url | append: site.baseurl | append: "/metapages/" | append: token | append: "/metapage.json" -%}
		{%- assign urlDebug = url | append: "?DEBUG" %}
| [{{ token }}]({{ url }})  | [debug]({{ urlDebug }}) | [Metapage JSON definition]({{ urlJson }}) |
	{%- endif -%}
{% endfor %}


## Example Metaframes

|:--------------------|:-----------------------|:------------------------|
{%- for metaframe in site.metaframes -%}
	{%- if metaframe.url contains 'index.html' -%}
		{%- assign index = metaframe.url | remove: "index.html" -%}
		{%- assign tokens = metaframe.url | remove: "/index.html" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- assign urlJson = site.baseurl | append: index | append: "metaframe.json" -%}
		{%- assign inspect = site.url | append: site.baseurl | append: "/tools/metaframeview?url=" | append: site.url | append: site.baseurl | append: "/metaframes/" | append: token | append: "/" %}
|  [{{ token }}]({{site.baseurl}}{{ index }}) | [Inspect]({{ inspect }})  | [JSON Definition]({{ urlJson }}) |
	{%- endif -%}
{% endfor %}
{%- assign externalMetaframes = "https://metapages.github.io/metaframe-editor-json/" | split: "," -%}
{%- for metaframeUrl in externalMetaframes -%}

	{%- if jekyll.environment != "production" -%}
		{%- assign metaframeUrl = "https://metapages.github.io/metaframe-editor-json/" | prepend: "http://localhost:3000/" -%}
	{%- endif -%}
	{%- assign urlJson = site.baseurl | metaframeUrl | append: "metaframe.json" -%}
	{%- assign inspect = site.url | append: site.baseurl | append: "/tools/metaframeview?url=" | append: metaframeUrl %}
| [{{ metaframeUrl }}]({{ metaframeUrl }}) | [Inspect]({{ inspect }})  | [JSON Definition]({{ urlJson }}) |
{% endfor %}

## Tools


{% if jekyll.environment == "production" -%}
	{%- assign appUrl = "https://app.metapages.org/" -%}
{%- else -%}
	{%- assign appUrl = site.data.urls.app-metapage-local -%}
{%- endif %}

|                          |Description             |
|:-------------------------|:-----------------------|
| [{{appUrl}}]({{appUrl}}) | Run any metapage (JSON) as a standalone application. Used to run the metapage examples above. Follow link for more details. |


## Plugins

[Plugin examples](https://github.com/metapages/metapage/issues/36) are coming soon.
