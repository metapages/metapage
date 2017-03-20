var connectionManager = new Metapage({debug:false});

var iframe1 = connectionManager.createIFrame('iframe1');
document.getElementById("metaframes").appendChild(iframe1.iframe);

var iframe2Id = 'iframe2';
var iframe2 = connectionManager.createIFrame('iframe2');
document.getElementById("metaframes").appendChild(iframe2.iframe);

connectionManager.pipe({from:{id:iframe1.id, pipe:'fooOut'}, to:{id:iframe2.id, pipe:'fooIn'}});
connectionManager.pipe({from:{id:iframe2.id, pipe:'barOut'}, to:{id:iframe1.id, pipe:'barIn'}});