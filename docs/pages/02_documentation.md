---
layout: default
title: Documentation
permalink: /documentation/
nav_order: 2
---

# How do I create a metapage?



For example, the small two-piece metapage above can be created with these two steps:

1) Include a the metapage script in your page:

{% highlight html %}
	<script src="https://cdn.jsdelivr.net/npm/metapage@{{site.data.versions.versions.last}}/browser.js"></script>
{% endhighlight %}





2) Then create the metaframes, connect them together, and add the metaframes to the document (in your Javascript:

{% highlight javascript %}
  //Create the metaframe object
  var metapage = new Metapage();

  //Create the metaframes
  var iframe1 = metapage.addMetaframe('{{site.baseurl}}/metaframes/example00_iframe1');
  document.getElementById("left").appendChild(iframe1.iframe);

  var iframe2 = metapage.addMetaframe('{{site.baseurl}}/metaframes/example00_iframe2');
  document.getElementById("right").appendChild(iframe2.iframe);

  //Connect the metaframes together
  metapage.pipe({from:{id:iframe1.id, pipe:'fooOut'}, to:{id:iframe2.id, pipe:'fooIn'}});
  metapage.pipe({from:{id:iframe2.id, pipe:'barOut'}, to:{id:iframe1.id, pipe:'barIn'}});

{% endhighlight %}

That's it. Instead of the above code, you can also create the collection of metaframes and connections with JSON:

{% highlight javascript %}
  //Create the metaframe object

  var metaframeJson = {
    "version": "0.1-alpha",
    "iframes": {
      "metaframe1": {
        "url": "{{site.baseurl}}/metaframes/example00_iframe1/"
      },
      "metaframe2": {
        "url": "{{site.baseurl}}/metaframes/example00_iframe2/"
      }
    },
    "pipes": [
      {
        "from": {
          "id": "metaframe1",
          "pipe": "fooOut"
        },
        "to": {
          "id": "metaframe2",
          "pipe": "fooIn"
        }
      },
      {
        "from": {
          "id": "metaframe2",
          "pipe": "barOut"
        },
        "to": {
          "id": "metaframe1",
          "pipe": "barIn"
        }
      }
    ]
  };
  var metapage = Metapage.fromDefinition(metaframeJson);

  //Just attach all the metaframes in a column
  var iframes = metapage.get_iframes();
  for (var key in iframes) {
    document.getElementById("metapage").appendChild(iframes[key]);
  }
{% endhighlight %}

You can also just paste the above json to the [metapage viewer]({{site.baseurl}}/tools/metapageview).
