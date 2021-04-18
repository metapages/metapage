---
---

<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
{% include metaframe_lib_script.html %}
</head>
<body>
<div class="navbar"><span id="title">Metaframe Random Data Generator</span></div>
<div class="wrapper">
<table>
  <thead>
    <tr>
      <th>Output</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>x</td>
      <td id='x'></td>
    </tr>
    <tr>
      <td>y</td>
      <td id='y'></td>
    </tr>
    <tr>
      <td>z</td>
      <td id='z'></td>
    </tr>
  </tbody>
</table>
<script>

var urlParams = new URLSearchParams(window.location.search);
var frequency = urlParams.get('frequency');
frequency = frequency || '200';
try {
  frequency = parseInt(frequency);
} catch(err) {
  console.log('frequency is in milliseconds');
  console.log(err);
  frequency = 200;
}

var metaframe = new metapage.Metaframe();
metaframe.ready
    .then(() => {
        document.getElementById('title').innerHTML = "";
        setInterval(() => {
            const x = Math.random();
            const y = Math.random();
            const z = Math.random();
            document.getElementById('x').innerText = `${x}`.substr(0, 10);
            document.getElementById('y').innerText = `${y}`.substr(0, 10);
            document.getElementById('z').innerText = `${z}`.substr(0, 10);
            metaframe.setOutputs({x:x, y:y, z:z});
        }, frequency);
    });
</script>
</div>
</body>
</html>
