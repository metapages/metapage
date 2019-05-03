---
layout: default
nav_order: 1
title: Introduction
---

# What is a *metapage*?

A metapage is a webpage that consists of **embedded** and **connected** webpages.

Embedded webpages are called **metaframes**. A metaframe can be any webpage that runs a small piece of javascript code that creates data pipes.

An example metapage showing two metaframes passing characters back and forth:


<div class="row">
  <div class="column" id="left">
  </div>
  <div class="column" id="middle">
    <div class="ArrowLeft"></div>
    <div class="ArrowRight"></div>
  </div>
  <div class="column" id="right">
  </div>
</div>
<!-- <link rel="stylesheet" href="{{site.baseurl}}/metapages/example00-basic/styles.css"> -->
{% include metapage_lib_script.html %}
<!-- <script src="{{site.baseurl}}/metapages/example00-basic/script1.js"></script> -->

# Why would you want to do this?

Browsers are an ideal platform to distribute applications: they are readily available, HTML/Javascript/CSS will run the same on all browsers, updates are trivial to push, and they are quite performant.

A website can crunch data, show interactive plots and graphics, allow sophisticated user interaction. In other words, all manner of useful things.

When you have somethine like a website that is specialized and does something well, eventually people want to combine useful pieces into a bigger whole.

These are metapages.

# How do I create a metapage?

See the <a href="{{site.baseurl}}/documentation/">docs</a> for more detailed documentation.



