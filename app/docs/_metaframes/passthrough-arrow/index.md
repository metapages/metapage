---
---

<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Metaframe pipe passthrough with arrow</title>
</head>
<body>

<div id="container">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22">
    <defs id="defs3051">
      <style type="text/css" id="current-color-scheme">
        .ColorScheme-Text {
          color:#4d4d4d;
        }
        </style>
    </defs>
  <path
      style="fill:currentColor;fill-opacity:1;stroke:none"
    d="m553.28572 626.6479l.64385-1.1428 8.35605-14.8572 8.35625 14.8572.64385 1.1428h-1.3008-15.57426-1.12494m1.78189-1.1428h14.27347l-7.05546-12.54476-7.21801 12.54476" transform="translate(-551.28571-607.64789)"
      class="ColorScheme-Text"
      />
  </svg>
</div>

<script>
var urlObject = new URL(window.location.href);
var angle = urlObject.searchParams.get('rotation') ? urlObject.searchParams.get('rotation') : '90' ;
document.getElementById("container").style.transform = 'rotate('+angle+'deg)';
</script>

</body>
</html>
