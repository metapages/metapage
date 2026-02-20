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
<script src="https://cdn.jsdelivr.net/npm/@metapages/metapage@{{site.data.versions.versions.last}}/browser/metaframe/index.js"></script>
```

```javascript

import { Metaframe } from "@metapages/metapage";

const metaframe = new Metaframe();

```

### In the metapage html:

```html
<script src="https://cdn.jsdelivr.net/npm/metapage@{{site.data.versions.versions.last}}/browser/metapage/index.js"></script>
```


```javascript

import { Metapage } from "@metapages/metapage";

const metapage = Metapage.from(...)

```

## webpack/node.js/grunt etc

```bash
npm i --save @metapages/metapage
```

## Promise

This library is meant to be a piece of the puzzle of preserving scientific information (among other things) over time. As such, we promise, to the best of our ability and resources, to maintain a maximum level of backwards and forwards compatibility between as many versions as possible betwen the two interacting libraries.
