---
---

var connectionManager = new Metapage({debug:false});

var url1 = '{{site.baseurl}}/metaframes/example00_iframe1/';
var iframe1 = connectionManager.createIFrame(url1);
document.getElementById("left").appendChild(iframe1.iframe);

var url2 = '{{site.baseurl}}/metaframes/example00_iframe2/';
var iframe2 = connectionManager.createIFrame(url2);
document.getElementById("right").appendChild(iframe2.iframe);

connectionManager.pipe({from:{id:iframe1.id, pipe:'fooOut'}, to:{id:iframe2.id, pipe:'fooIn'}});
connectionManager.pipe({from:{id:iframe2.id, pipe:'barOut'}, to:{id:iframe1.id, pipe:'barIn'}});
