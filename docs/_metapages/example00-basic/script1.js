---
---

var connectionManager = new metapage.Metapage({debug:false});

var url1 = '{{site.baseurl}}/metaframes/example00_iframe1/';
var iframe1 = connectionManager.createIFrame(url1);
document.getElementById("left").appendChild(iframe1.iframe);

var url2 = '{{site.baseurl}}/metaframes/example00_iframe2/';
var iframe2 = connectionManager.createIFrame(url2);
document.getElementById("right").appendChild(iframe2.iframe);

connectionManager.pipe({source:{id:iframe1.id, name:'fooOut'}, target:{id:iframe2.id, name:'fooIn'}});
connectionManager.pipe({source:{id:iframe2.id, name:'barOut'}, target:{id:iframe1.id, name:'barIn'}});
