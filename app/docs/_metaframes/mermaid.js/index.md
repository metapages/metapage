---
---

<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
{% if jekyll.environment == "production" %}
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
{% else %}
<script src="{{site.baseurl}}/assets/js/mermaid.min.js"></script>
{% endif %}
<script>
    let config = {
    	startOnLoad: true,
    	flowchart:{
    		useMaxWidth: false,
    		htmlLabels: false,
    	},
    	securityLevel:'loose',
    };
    mermaid.mermaidAPI.initialize(config);

</script>
{% include metaframe_lib_script.html %}
</head>
<body>
<div id="title"></div>

<script>

const metaframe = new metapage.Metaframe();

window.handleClick = (nodeClickText) => {
	metaframe.setOutput("click", nodeClickText)
}

const setGraphFromString = (graphString) => {
	let element = document.querySelector(`#graph`);

	if (element) {
		const parent = element.parentElement;
		if (element && parent) {
			parent.removeChild(element);
		}
	}

	const parent = document.body;

	element = document.createElement('div');
	element.id = 'graph';
	element.style = 'max-height:300px; height:300px; max-width:100%; width:100%; min-width:200px;';
	parent.appendChild(element);

	var insertSvg = function(svgCode, bindFunctions){
		element.innerHTML = svgCode;
		if (typeof callback !== 'undefined') {
			callback(element.id);
		}
		bindFunctions(element);
	};
	var graph = mermaid.render('svgId', graphString, insertSvg);
	// mermaid.contentLoaded()
}

// const setGraphTitle = (titleString) => {
// 	document.getElementById('title').innerText = titleString;
// }

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

	let graphDefinition = "graph LR";
	const metaframeKeys = Object.keys(metapageDefinition.metaframes);
	const metaframeKeysToMermaidId = Object.fromEntries(
    Object.entries(metapageDefinition.metaframes).map(
      ([k, v], i) => [k, i + 1]
    ));

	const safe = (s) => { return s.replace(/-/g, '_') };
	metaframeKeys.forEach(function(metaframeId, index) {
		graphDefinition += `\n\t${metaframeKeysToMermaidId[metaframeId]}["${metaframeId}"]`;
		graphDefinition += `\n\tclick ${metaframeKeysToMermaidId[metaframeId]} handleClick`;
	});
	metaframeKeys.forEach(function(metaframeId, index) {
		if (metapageDefinition.metaframes[metaframeId].inputs && Object.keys(metapageDefinition.metaframes[metaframeId].inputs).length > 0) {
			metapageDefinition.metaframes[metaframeId].inputs.forEach((pipe) => {
				if (pipe.target) {
				    graphDefinition += `\n\t${metaframeKeysToMermaidId[pipe.metaframe]}-- ${safe(pipe.source)}:${safe(pipe.target)} -->${metaframeKeysToMermaidId[metaframeId]}`;
				} else {
					graphDefinition += `\n\t${metaframeKeysToMermaidId[pipe.metaframe]}-- ${safe(pipe.source)} -->${metaframeKeysToMermaidId[metaframeId]}`;
				}
			});
		}
	});

	graphDefinition += '\n';

	const searchParams = new URL(window.location.href).searchParams;
	// if (!(searchParams.get('TITLE') == '0' || searchParams.get('TITLE') == 'false')) {
	// 	setGraphTitle('metapage/definition');
	// }
	setGraphFromString(graphDefinition);
};



metaframe.onInputs((inputs) => {
	var oneKey = Object.keys(inputs)[0];
	if (!oneKey) {
		return;
	}
	if (oneKey == 'metapage/definition') {
		createMermaidFlowchartFromMetapage(inputs[oneKey]);
	} else {
		// setGraphTitle(oneKey);
		setGraphFromString(inputs[oneKey]);
	}
});

</script>
</body>
</html>
