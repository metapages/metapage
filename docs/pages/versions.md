---
layout: default
title: versions
permalink: /versions/
nav_exclude: true

---

## API versions

{% assign versions = site.versions | sort: 'name' | reverse %}
{% for version in versions %}
<a href="{{ version.url }}">
    {{ version.version }}
</a>
```html
<script src="https://cdn.jsdelivr.net/npm/metapage@{{ version.version }}/browser.js"></script>
<script src="https://cdn.jsdelivr.net/npm/metaframe@{{ version.version }}/browser.js"></script>
```
<br/>
{% endfor %}
