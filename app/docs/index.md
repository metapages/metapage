---
layout: default
nav_order: 1
title: Introduction
---

# What is a *metapage*?

A metapage is a webpage that consists of **embedded** and **connected** webpages.

Embedded webpages are called **metaframes**. A metaframe can be any webpage that runs a small piece of javascript code that creates data pipes.

An example metapage showing two metaframes, one generating randome data, the other plotting whatever date it gets:

{% if jekyll.environment == "production" %}
  [https://app.metapages.org/?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/](https://app.metapages.org/?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/)
  <iframe border="0" src="https://app.metapages.org/?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/" style="width:600px;height:400px"></iframe>
{% else %}
  [{{site.data.urls.app-metapage-local}}?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/]({{site.data.urls.app-metapage-local}}?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/)
  <iframe border="0" src="{{site.data.urls.app-metapage-local}}?header=0#url={{site.url}}{{site.baseurl}}/metapages/dynamic-plot/" style="width:600px;height:400px"></iframe>
{% endif %}

The two pages above are completely separate websites, and have no idea about the other. One simply passes data to the other, controlled by the metapage code running in the parent page.

# Why would you want to do this?

Browsers are an ideal platform to distribute applications: they are readily available, HTML/Javascript/CSS will run the same on all browsers, updates are trivial to push, and they are quite performant.

A website can crunch data, show interactive plots and graphics, allow sophisticated user interaction. In other words, all manner of useful things.

When you have somethine like a website that is specialized and does something well, eventually people want to combine useful pieces into a bigger whole.

These are metapages.

# How do I create a metapage?

See the <a href="{{site.baseurl}}/documentation/">docs</a> for more detailed documentation.
