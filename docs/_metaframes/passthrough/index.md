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
    <link rel="stylesheet" href="css/fontello.css">
    <link rel="stylesheet" href="css/index.css">
    <title>Metaframe pipe passthrough</title>
</head>
<body>

<div class="container">
  <div id="header">
    <a id="add-input-button" class="button is-success is-outlined">
      <span class="icon is-small">
        <i class="icon-plus-squared-alt"></i>
      </span>
    </a>
    <h3 id="nodata">No data as yet</h3>
  </div>
  <div id="input-rows" class="input-rows"></div>
</div>

{% include metaframe_lib_script.html %}
<script src="index.js"></script>
</body>
