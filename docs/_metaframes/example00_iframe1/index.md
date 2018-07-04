---
layout: vanilla
---

<style>
   body {
       background-color: #93B874;
   }
</style>

<script src="{{site.baseurl}}{{site.data.urls.promise_polyfill}}"></script>

Metaframe 1 (an iframe)

<div id="input" style="outline-width: 1px;"></div>


{% include metaframe_lib_script.html %}
<script src="iframe1.js"></script>

When I get input data, I will send the string back out a pipe with the same name, randomly adding one of these characters:

♞☯☭☢€☎∞❄♫☂★☀✓❤✆✇✈✂✄❀❁❂❃✻✼✽✾✿✧✨✩✪✫✍✎✏


