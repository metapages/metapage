---
layout: vanilla
---

<head>
<script src="{{site.baseurl}}{{site.data.urls.axios_path}}"></script>
<script src="{{site.baseurl}}{{site.data.urls.jquery_path}}"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/siimple@3.3.1/dist/siimple.min.css">

{% include metapage_lib_script.html %}

<style>
  .iframe-container {
    overflow: hidden;
    padding-top: 100%;
    position: relative;
}

.iframe-container iframe {
    border: 0;
    /* border: 1px solid red; */
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
}
</style>

</head>

<body>
<div class="siimple-h2">Metapage viewer</div>

<div class="siimple-card">
  <div class="siimple-card-body">
    <div class="siimple-form">
      <div class="siimple-form-field">
        <div class="siimple-form-field-label">Paste metapage JSON here:</div>
        <textarea id="metapagejson" class="siimple-textarea siimple-textarea--fluid" rows="5">

        {
  "version": "0.3",
  "meta": {
    "layouts": {
      "flexboxgrid" : {
        "docs": "http://flexboxgrid.com/",
        "layout": [
          [ 
            {"url":"http://0.0.0.0:4000/metaframes/passthrough-arrow/?rotation=90", "width":"col-xs-1", "style": {"maxHeight":"600px"}},
            {"name":"graph-dynamic", "width":"col-xs-7"}
          ]
        ]
      }
    }
  },
  "metaframes": {
    "graph-dynamic": {
      "url": "http://0.0.0.0:4000/metaframes/graph-dynamic/",
      "inputs": []
    }
  },
	"plugins": [    
		"http://localhost:1234/"

	]
}


        </textarea>
      </div>
      <div class="siimple-form-field">
        <div class="siimple-btn siimple-btn--blue" id="showMetapageButton">Show Metapage:</div>
      </div>
    </div>
  </div>
</div>

<div class="siimple-h5">Plugins:</div>
<br/>
<div class="siimple-grid" id="plugins"></div>
<div class="siimple-rule"></div>


<div class="siimple-h5">Metaframes:</div>
<br/>
<div class="siimple-grid" id="metaframes"></div>

</body>

<script src="index.js"></script>
