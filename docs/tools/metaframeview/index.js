var urlObject = new URL(window.location.href);
var urlParam = urlObject.searchParams.get('url');

document.getElementById("url").innerHTML = urlParam;
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

		fetch(metaframeDataUrl.toString(), {method: 'get',mode: 'cors', redirect: 'follow', cache: 'no-cache'})
			.then(function(response) {
				if(response.ok) {
					return response.json();
				}
				throw new Error(`fetch ${metaframeDataUrl.toString()} failed status=${response.status } error=${Response.statusText}`);
			})
			.then(function(metaframeJson) {
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
		version: '0.3',
		metaframes: {},
	};

	metapageDef.metaframes[idInputs] = {
		url: 'https://metapages.org/metaframes/passthrough/?edit=1',
		inputs: [],
	};

	metapageDef.metaframes[idOutputs] = {
		url: 'https://metapages.org/metaframes/passthrough/?edit=0',
		inputs: [
			{
				metaframe: idTarget,
				source: '*',
			}
		],
	};

	metapageDef.metaframes[idTarget] = {
		url: urlParam,
		inputs: [
			{
				metaframe: idInputs,
				source: '*',
			}
		]
	};

	const metapageInstance = metapage.Metapage.from(metapageDef);
	const metaframe = metapageInstance.getMetaframe(idTarget);
	const metaframeInputs = metapageInstance.getMetaframe(idInputs);
	const metaframeOutputs = metapageInstance.getMetaframe(idOutputs);

	if (startInputs) {
		const startState = {};
		startState[idInputs] = {};
		for (inputKey in startInputs) {
			// This doesn't set a value, but it makes the input metaframe show the input names
			startState[idInputs][inputKey] = null;
		}
		metapageInstance.setInputs(startState);
	}

	document.getElementById("container-inputs").appendChild(metaframeInputs.iframe);
	document.getElementById("container-outputs").appendChild(metaframeOutputs.iframe);
	document.getElementById("container-metaframe").appendChild(metaframe.iframe);
}
