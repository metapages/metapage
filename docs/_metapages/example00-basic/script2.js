---
---

//Add links

var a1 = document.createElement('a');
a1.setAttribute('href', url1);
a1.innerHTML = 'Go to metaframe';
document.getElementById("left").appendChild(a1);

var a2 = document.createElement('a');
var urlInspect = '{{site.baseurl}}/tools/metaframeview?url=' + url1;
a2.setAttribute('href', urlInspect);
a2.innerHTML = 'Inspect metaframe';
document.getElementById("left").appendChild(a2);

var b1 = document.createElement('a');
b1.setAttribute('href', url2);
b1.innerHTML = 'Go to metaframe';
document.getElementById("right").appendChild(b1);

var b2 = document.createElement('a');
var urlInspect = '{{site.baseurl}}/tools/metaframeview?url=' + url2;
b2.setAttribute('href', urlInspect);
b2.innerHTML = 'Inspect metaframe';
document.getElementById("right").appendChild(b2);