---
---

var urlObject = new URL(window.location.href);
var urlParam = urlObject.searchParams.get('url');

document.getElementById("url").innerHTML = urlParam;
console.log('urlParam', urlParam);
if (urlParam != null) {
	var metaframeDataUrl;
	try {
		metaframeDataUrl = new URL(urlParam);
	} catch (err) {
		document.getElementById("url").innerHTML = `Invalid URL: ${urlParam}`;
	}

	if (metaframeDataUrl != null) {
		if (!metaframeDataUrl.pathname.endsWith('/metaframe.json')) {
			if (metaframeDataUrl.pathname.endsWith('/')) {
				metaframeDataUrl.pathname = metaframeDataUrl.pathname.substring(0, metaframeDataUrl.pathname.length - 1);
			}
			metaframeDataUrl.pathname = metaframeDataUrl.pathname + '/metaframe.json';
		}
		console.log('metaframeDataUrl', metaframeDataUrl);
		fetch(metaframeDataUrl.toString(), {method: 'get',mode: 'cors', redirect: 'follow', cache: 'no-cache'})
			.then(function(response) {
				if(response.ok) {
					return response.json();
				}
				throw new Error(`fetch ${metaframeDataUrl.toString()} failed status=${response.status } error=${Response.statusText}`);
			})
			.then(function(metaframeJson) {
				console.log(metaframeJson);
				buildEditorWithInitialInputs(metaframeJson.inputs);
			})
			.catch(function(error) {
				console.error(error);
			});
	}
}

function buildEditorWithInitialInputs(startInputs) {

	var idInputs = 'inputsId';
	var idOutputs = 'outputsId';
	var idTarget = 'target';
	var metapageDef = {
		id: '_',
		version: '0.1.0',
		iframes: {},
		pipes: [
			{
				source: {
					id: idInputs,
					name:'*',
				},
				target: {
					id: idTarget,
					name:'*',
				}
			},
			{
				source: {
					id: idTarget,
					name:'*',
				},
				target: {
					id: idOutputs,
					name:'*',
				}
			}
		],
	};

	metapageDef.iframes[idInputs] = {
		url: '{{site.baseurl}}/metaframes/passthrough/?edit=1',
		// state: startInputs,
		inputs: []
	};
	
	metapageDef.iframes[idOutputs] = {
		url: '{{site.baseurl}}/metaframes/passthrough/?edit=0',
		inputs: [],
	};
	metapageDef.iframes[idOutputs].inputs.push({
		metaframe: idTarget,
		source: '*',
	});

	metapageDef.iframes[idTarget] = {
		url: urlParam,
		// state: startInputs,
		inputs: []
	};
	metapageDef.iframes[idTarget].inputs.push({
		metaframe: idInputs,
		source: '*',
	});

	var startState = {};
	// startState[idInputs] = startInputs;
	// startState[idTarget] = startInputs;

	var mp = metapage.Metapage.fromDefinition(metapageDef, startState);
	var metaframe = mp.getMetaframe(idTarget);
	var metaframeInputs = mp.getMetaframe(idInputs);
	var metaframeOutputs = mp.getMetaframe(idOutputs);

	document.getElementById("container-inputs").appendChild(metaframeInputs.iframe);
	document.getElementById("container-outputs").appendChild(metaframeOutputs.iframe);
	document.getElementById("container-metaframe").appendChild(metaframe.iframe);
}
