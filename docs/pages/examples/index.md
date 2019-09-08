---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

| Run Metapage        | Metapage JSON          | Run Metapage debug mode |
|:-------------|:------------------|:------|
{%- for metapage in site.metapages -%}
	{%- if metapage.url contains 'index.html' -%}
		{%- assign tokens = metapage.url | remove: "/index.html" | split: "/" -%}
		{%- assign token = tokens.last -%}
		{%- if jekyll.environment == "production" -%}
			{%- assign url = "https://app.metapages.org/#url=" | append: site.url | append: "/metapages/" | append: token | append: "/" -%}
		{%- else -%}
			{%- assign url = site.data.urls.app-metapage-local | append: "#url=" | append: site.url | append: "/metapages/" | append: token | append: "/" -%}
		{%- endif -%}
		{%- assign urlJson = "{{site.data.urls.app-metapage-local}}/#url=" | append: site.url | append: "/metapages/" | append: token | append: "/metapage.json" %}
| [{{ token }}]({{ url }}) | [Metapage JSON definition]({{ urlJson }})  | test |
	{%- endif -%}
{% endfor %}


	<!-- 
	{%- assign token = tokens.last -%}
	{%- if jekyll.environment == "production" -%}
		{%- assign url = "https://app.metapages.org/#url={{site.url}}/metapages/{{token}}/" -%}
	{%- else -%}
		{%- assign url = "{{site.data.urls.app-metapage-local}}/#url={{site.url}}/metapages/{{token}}/" -%}
	{%- endif -%}
	 -->


<!-- Metapages:
<ul id="metapages"></ul>

Metaframes:
<ul id="metaframes"></ul>

Plugins:
<ul id="plugins"></ul>

Tools:
<ul id="tools"></ul>

<script src="index.js"/> -->
