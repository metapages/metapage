---
layout: default
title: Install/Download
permalink: /install/
nav_order: 5
---

# Installing

## Browsers

### In the metaframe html:

```html
<script src="https://cdn.jsdelivr.net/npm/metaframe@{{site.data.versions.versions.last}}/browser.js"></script>
```

### In the metapage html:

```html
<script src="https://cdn.jsdelivr.net/npm/metapage@{{site.data.versions.versions.last}}/browser.js"></script>
```

## webpack/node.js/grunt etc

```bash
npm i --save metapage
npm i --save metaframe
```

## Previous Versions

As new versions are released, previous version docs are archived here.

*All* metaframe versions are expected to be compatible with *all* metapage versions, and automated testing will be built to verify.

- [v0.3.0 API docs]({{site.url}}{% link pages/previous_versions/api_0.3.0.md %})
    ```html
    <script src="https://cdn.jsdelivr.net/npm/metapage@0.3.0/browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/metaframe@0.3.0/browser.js"></script>
    ```


- [v0.2.0 API docs]({{site.url}}{% link pages/previous_versions/api_0.2.0.md %})
    ```html
    <script src="https://cdn.jsdelivr.net/npm/metapage@0.2.0/browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/metaframe@0.2.0/browser.js"></script>
    ```
   
- [v0.1.35 API docs]({{site.url}}{% link pages/previous_versions/api_0.1.35.md %})
    ```html
    <script src="https://cdn.jsdelivr.net/npm/metapage@0.1.35/browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/metaframe@0.1.35/browser.js"></script>
    ```
