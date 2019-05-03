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
<script src="https://cdn.jsdelivr.net/npm/metaframe@{{site.data.lib_versions.metaframe}}/browser.js"></script>
```

### In the metapage html:

```html
<script src="https://cdn.jsdelivr.net/npm/metapage@{{site.data.lib_versions.metapage}}/browser.js"></script>
```

## webpack/node.js/grunt etc

```bash
npm i --save metapage
npm i --save metaframe
```

## Previous Versions

As new versions are released, previous version docs are archived here.

*All* metaframe versions are expected to be compatible with *all* metapage versions, and automated testing will be built to verify.

- [v0.1.35 API docs]({{site.url}}{% link pages/previous_versions/api_0.1.35.md %})
    ```html
    <script src="https://cdn.jsdelivr.net/npm/metapage@0.1.35/browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/metaframe@0.1.35/browser.js"></script>
    ```

 - [v0.1.34 API docs]({{site.url}}{% link pages/previous_versions/api_0.1.34.md %})
    ```html
    <script src="https://cdn.jsdelivr.net/npm/metapage@0.1.34/browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/metaframe@0.1.34/browser.js"></script>
    ```
