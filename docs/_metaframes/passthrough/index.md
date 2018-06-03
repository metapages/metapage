---
layout: vanilla
---
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <link rel="stylesheet" href="css/bulma-0.7.1.css">
    <link rel="stylesheet" href="index.css">
    <title>Metaframe pipe passthrough</title>
    <script defer src="font-awesome-all-v5.0.7.js"></script>
</head>
<body>

<div class="container">
  <div id="header">
    <a id="add-input-button" class="button is-success is-outlined">
      <!-- <span>Input</span> -->
      <span class="icon is-small">
        <i class="fas fa-plus"></i>
      </span>
    </a>
    <h3 id="nodata">No data as yet</h3>
    <!-- <button id="add-input-button" class="button is-success is-outlined" >Input</button> -->
  </div>
  <div id="input-rows" class="input-rows"></div>
</div>

<script src="{{site.baseurl}}{{site.data.urls-internal.metaframe_library_path}}"></script>
<script src="index.js"></script>
</body>

