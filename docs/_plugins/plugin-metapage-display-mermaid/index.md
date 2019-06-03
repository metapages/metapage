---
layout: vanilla
---

<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script src="https://unpkg.com/mermaid@8.0.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
{% include metaframe_lib_script.html %}
</head>
<body>
<div class="wrapper">
    <div id="graph" ></div>  
    <!-- style="max-height:300px;"  -->
</div>
<script>

const test = {
  "version": "0.2",
  "meta": {
    "name": "Linked molecule viewers",
    "description": "Demonstrates interactive bioinformatics tools and selective replication and forwarding of data streams",
    "layouts": {
      "flexboxgrid" : {
        "version": 1,
        "docs": "http://flexboxgrid.com/",
        "layout": [
          [ {"name":"input-button", "width":"col-xs-4", "style": {"maxHeight":"400px"}}, {"url":"http://0.0.0.0:4000/metaframes/passthrough-arrow/?rotation=90", "width":"col-xs-2"}, {"name":"viewer1", "width":"col-xs-6"} ],
          [ {"name":"passthrough2", "width":"col-xs-6"}, {"name":"passthrough1", "width":"col-xs-6", "style": {"maxHeight":"100px"}} ],
          [ {"name":"viewer2", "width":"col-xs-6", "style": {"maxHeight":"400px"}} , {"name":"viewer3", "width":"col-xs-6"} ]
        ],
        "options": {
          "arrows": true
        }
      }
    }
  },
  "metaframes": {
    "input-button": {
      "url": "http://0.0.0.0:4000/metaframes/pdb-input-button/"
    },
    "input-button": {
      "url": "http://0.0.0.0:4000/metaframes/pdb-input-button/"
    },
    "viewer1": {
      "url": "http://0.0.0.0:4000/metaframes/molviewer-pv/",
      "inputs": [
        {
          "metaframe": "input-button",
          "source": "pdb_data"
        }
      ]
    },
    "viewer2": {
      "url": "http://0.0.0.0:4000/metaframes/molviewer-pv/",
      "inputs": [
        {
          "metaframe": "input-button",
          "source": "pdb_data"
        },
        {
          "metaframe": "viewer1",
          "source": "camera_out",
          "target": "camera_in"
        },
        {
          "metaframe": "passthrough2",
          "source": "zoom"
        }
      ]
    },
    "viewer3": {
      "url": "http://0.0.0.0:4000/metaframes/molviewer-pv/",
      "inputs": [
        {
          "metaframe": "input-button",
          "source": "pdb_data"
        },
        {
          "metaframe": "viewer1",
          "source": "camera_out",
          "target": "camera_in"
        },
        {
          "metaframe": "passthrough1",
          "source": "rotation"
        }
      ]
    },
    "passthrough1": {
      "url": "http://0.0.0.0:4000/metaframes/passthrough/",
      "inputs": [
        {
          "metaframe": "viewer1",
          "source": "rotation"
        }
      ]
    },
    "passthrough2": {
      "url": "http://0.0.0.0:4000/metaframes/passthrough/",
      "inputs": [
        {
          "metaframe": "viewer1",
          "source": "zoom"
        }
      ]
    }
  }
}


const createMermaidFlowchartFromMetapage = (metapageDefinition) => {

    if (!metapageDefinition) {
        console.log(`Cannot graph: ${metapageDefinition} is null`);
        return;
    }

    if (typeof metapageDefinition === 'string') {
        // maybe it is a JSON string
        try {
            metapageDefinition = JSON.parse(metapageDefinition);
        } catch(err) {
            // guess not
            console.log(`Cannot graph:"${metapageDefinition}"`);
            return;
        }
    }

    if (!metapageDefinition.metaframes) {
        console.log(`Cannot graph, no metaframes: ${JSON.stringify(metapageDefinition, null, "  ")}`);
        return;
    }

    let graphDefinition = "graph LR\n";
    Object.keys(metapageDefinition.metaframes).forEach(function(metaframeId) {
        if (metapageDefinition.metaframes[metaframeId].inputs && Object.keys(metapageDefinition.metaframes[metaframeId].inputs).length > 0) {
            metapageDefinition.metaframes[metaframeId].inputs.forEach((pipe) => {
                if (pipe.target) {
                    graphDefinition += `\n\t${pipe.metaframe}-- ${pipe.source}:${pipe.target} -->${metaframeId}`;
                } else {
                    graphDefinition += `\n\t${pipe.metaframe}-- ${pipe.source} -->${metaframeId}`;
                }
            });
        } else {
            graphDefinition += `\n\t${metaframeId}`;
        }
        
    });
    var element = document.querySelector(`#graph`);

    var insertSvg = function(svgCode, bindFunctions){
        element.innerHTML = svgCode;
    };
    var graph = mermaid.render('svgId', graphDefinition, insertSvg);
};

const metaframe = new Metaframe();
metaframe.onInput('metapage/definition', createMermaidFlowchartFromMetapage);

// createMermaidFlowchartFromMetapage(test);


</script>
</body>
