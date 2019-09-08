---
layout: default
title: Examples
permalink: /examples/
nav_order: 5
---

| head1        | head two          | three |
|:-------------|:------------------|:------|
| ok           | good swedish fish | nice  |
| out of stock | good and plenty   | nice  |
| ok           | good `oreos`      | hmm   |
| ok           | good `zoute` drop | yumm  |
{% for metapage in site.metapages %}
{% if metapage.url contains 'index.html' %}
| test | test  | test |
{% endif %}
{% endfor %}


Metapages trial:

|Run Metapage  |Metapage JSON  | Run Metapage debug mode |
|:-------------|:--------------|:------------------------|
{% for metapage in site.metapages -%}
{% if metapage.url contains 'index.html' -%}
| {{ metapage.url }} | [Click Here]({{ metapage.url }})  | test |
{% endif %}
{%- endfor -%}


Metapages:
<ul id="metapages"></ul>

Metaframes:
<ul id="metaframes"></ul>

Plugins:
<ul id="plugins"></ul>

Tools:
<ul id="tools"></ul>

<script src="index.js"/>
