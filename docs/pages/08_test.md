---
layout: default
title: Test
permalink: /test/
nav_order: 8
has_children: false
---

We strive to make all versions of the metaframe library compatible with all versions of the metapage library.

{% if jekyll.environment == "production" %}
So we [display the tests of version vs version]({{site.baseurl}}/pages/test/index.html)
{% else %}
So we [display the tests of version vs version]({{site.baseurl}}/pages/test/index.html?VERSION=latest)
{% endif %}
