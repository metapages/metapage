---
layout: default-with-mermaid
title: API
permalink: /api/0.3.3/
version: 0.3.3
nav_exclude: true
---



# API Reference v0.3.3
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }


1. TOC
{:toc}


MetapageDefinition<a name="metapagedefinition"></a>
-----

The JSON description consists of metaframes and the metaframe inputs.

Example minimal metapage with two metaframes:
<div class="language-mermaid">graph LR
metaframe1["random-data-generator"] -- "y -> y" --> metaframe2["graph-dynamic"]
</div>

Defined by:

```json
{
  "version": "0.3",
  "meta": {
    "layouts": {
      "flexboxgrid" : {
        "docs": "http://flexboxgrid.com/",
        "layout": [
          [ {"name":"random-data-generator", "width":"col-xs-4", "style": {"maxHeight":"600px"}}, {"url":"{{site.url}}/metaframes/passthrough-arrow/?rotation=90", "width":"col-xs-1"}, {"name":"graph-dynamic", "width":"col-xs-7"}  ]
        ]
      }
    }
  },
  "metaframes": {
    "random-data-generator": {
      "url": "{{site.url}}/metaframes/random-data-generator/?frequency=1000"
    },
    "graph-dynamic": {
      "url": "{{site.url}}/metaframes/graph-dynamic/",
      "inputs": [
        {
          "metaframe": "random-data-generator",
          "source": "y",
          "target": "y"
        }
      ]
    }
  },
  "plugins": [
    "{{site.url}}/metaframes/mermaid.js/"
  ]
}

```

{% if jekyll.environment == "production" %}
  [Run above example](https://app.metapages.org/#url={{site.url}}/metapages/dynamic-plot/metapage.json){: .btn .btn-green }
{% else %}
  [Run above example]({{site.data.urls.app-metapage-local}}/#url={{site.url}}/metapages/dynamic-plot/metapage.json){: .btn .btn-green }
{% endif %}

The `pipe` entries of "inputs" are objects describing the source metaframe, source metaframe output pipe name, and the target metaframe (the owning metaframe) input pipe name 
```js
{
  "metaframe": "<sourceMetaframeId>",
  "source": "<sourceMetaframePipeName>",
  "target": "<thisMetaframePipeName>",
}
```

`pipe.metaframe`: source metaframeId

`pipe.source`: source metaframe output pipe name. Can be `*` or any glob, this will forward all output pipes matching the glob

`pipe.target`: (optional) target metaframe input pipe name. If `target` is omitted, then the input pipe name will be the same as the output pipe name.

<div class="language-mermaid">graph LR
metaframeSource[pipeInput.metaframe] -- "pipeInput.source -> pipeInput.target" --> targetMetaframe
</div>

<!-- {: .fs-5 .ls-10 .text-mono .code-example } -->



`version`: This library hasn't reached version `"1"` yet. Backwards compatibility is built into this library from it's first release, and will be automated as much as possible. This is required to maintain long-term compatibility: metaframes should be useful forever, if that is possible from the content. Users should only need to upgrade for bug fixes, performance improvements, or to access new features, and there should never be cognitive load (no worries) about versioning for library users. Mistakes happen, no process is perfect, but this tool assumes the burden of handling all changes to versions over time.

---


Metapage
-----

A metapage manages piping metaframe outputs to metaframe inputs.

Ways to initialize a metapage:
1. Load a `metapage.json` dynamically and add the metaframes. If no `loadCallback` is given, metaframe iframes will automatically be added to the document element with the id that matches the metaframe id:
  ```ts
  Metapage.load(?metapage :<string|object>, ?loadCallback :func): Promise<Metapage>
  ```
  <br/>`metapage`: URL to metapage definition, defaults to "metapage.json", or the metapage JSON object
  <br/>`loadCallback`: optional callback with two arguments `(metaframeId, IFrameElement)`
2. Create a metapage from a [MetapageDefinition](#metapagedefinition) JSON object. No metaframes are yet added to the page:
  ```ts
  const metapage = Metapage.from(def :MetapageDefinition, ?opts :Options): Metapage
  // updating the definition
  metapage.setDefinition(def :MetapageDefinition)
  ```


The optional ```opts``` argument defineds some extra options, mostly used for debugging:

```typescript
interface Options {
  color?: String;  // Color of console.logs, since all iframes and the main page will output logs to the same console
  id?   : String;  // Id, not required, but useful if you have multiple metapages in a single website.
}
```

If the URL has the parameter `MP_DEBUG` then debug logging is enabled: `https://domain.org/metapage1?MP_DEBUG`


### Metapage#dispose

```ts
metapage.dispose()
```

Removes all metaframes, window listeners, event listeners.

### Metapage#getMetaframe

```ts
metapage.getMetaframe(metaframeId :String): MetaframeClient
```

Get the MetaframeClient for the given id.

### Metapage#getIframes

```ts
metapage.getIframes(): Map<String, IFrameElement>
```

Returns a plain Object with metaframe ids mapped to the underlying metaframe [iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).


### Metapage#getMetaframeIds

```ts
metapage.metaframeIds(): Array<String>
```

Returns an array of metaframe ids.


### Metapage#getMetaframes()

```ts
metapage.getMetaframes(): Map<String, MetaframeClient>
```

Returns a plain Object with metaframe ids mapped to MetaframeClient objects.


### Metapage#getPluginIds

```ts
metapage.getPluginIds(): Array<String>
```

Returns an array of plugin ids.


### Metapage#getPlugins()

```ts
metapage.getPlugins(): Map<String, MetaframeClient>
```

Returns a plain Object with metaframe ids mapped to MetaframeClient objects.

### Metapage#getState()

```ts
metapage.getState(): State

```

Where `State` looks like:
```json
{
  "metaframes": {
    "inputs": {
      "metaframeId1": {
        "inputPipe1": true
      }
    }
  }
```

It represents the entire state of the metapage.

### Metapage#setState()

```ts
metapage.setState(state :State)

```

This will update the entire state of the application and set all the metaframe inputs.


### Metapage#onState()

```ts
metapage.onState(function(state :State) { ... });

```

The callback is called on every state change.

### Metapage#setDefinition()

```ts
metapage.setDefinition(def :Definition)

```

### Metapage#getDefinition()

```ts
var def :Definition = metapage.getDefinition();

```


### Metapage#onInputs

```ts
metapage.getMetaframe(<metaframeId>).onInputs(function(inputs) {...}): function():
```

Callback called on every input update event. Example `inputs` payload:

```js
{
  "inputPipeId1": "value"
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.getMetaframe(<metaframeId>).on('inputs', function(inputs) {...}): function():
```

You can also listen on the metaframe clients directly:

```ts
metapage.get(metaframeId).on('inputs', function(inputs) {...}): function():
```


### Metapage#onOutputs

```ts
metapage.get(metaframeId).onOutputs(function(outputs) {...}): function():
```

Callback called on every output update event. Example `outputs` payload:

```js
{
  "outputPipeId1": "value"
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.get(metaframeId).on('outputs', function(outputs) {...}): function():
```


### Metapage#removeAll

```ts
metapage.removeAll()
```

Removes all metaframes, essentially resetting the metapage. It doesn't remove window listeners though, for proper disposal call `dispose()`.


### Metapage#setInput/setInputs

Set metaframe inputs a variety of ways (there is no difference between `setInput/setInputs` calls). 


```ts
metapage.setInput(metaframeId :String, inputPipeId :String, value :any)
metapage.setInput(metaframeId :String, inputsObject :any)
metapage.setInput(metaframeInputsObject :any)
```

`inputsObject`:
```js
{
  "inputPipeName": "some value"
}
```

`metaframeInputsObject`:
```js
{
  "metaframeId": {
    "inputPipeName": "some value"
  }
}
```

### Metapage#setDefinition

Update the metapage definition.

This will destroy the current metaframes and plugins, and recreate new ones based on the new definition.

The 

### Metapage events

#### Metapage#STATE

Metapage event allows you to add hooks to the data flow:

```js
/**
 * Example update:
 * {
 *   "metaframes": {
 *     "inputs": {
 *        "metaframe1": {
 *          "input1": "foobar",
 *          "input2": 3
 *        }
 *     }
 *   }
 * }
 */
metapage.on('state', function(metapageState) { ...});
metapage.on(Metapage.STATE, function(definition) { ... });
```

Listens to changes in the `state` for metaframes (and plugins). The listener is called on every discrete update of inputs and outputs.


#### Metapage#DEFINITION
```ts
/**
 * Example definition event:
 * {
 *   "definition": { <MetapageDefinition> },
 *   "metaframes": {
 *     "metaframe1": { "url": "{{site.url}}/metaframes/example1/" },
 *     "metaframe2": { "url": "{{site.url}}/metaframes/example2/" }
 *   },
 *   "plugins": [
 *     { "plugin1": "https://plugin1.io" },
 *     { "plugin2": "https://plugin2.io" }
 *   ]
 * }
 */
metapage.on('definition', function(definition) { ... });
metapage.on(Metapage.DEFINITION, function(definition) { ... });

metapage.setDefinition(def :MetapageDefinition); // Fires above event
metapage.getDefinition(def) :MetapageDefinition;
```
The definition can be updated, this will fire on every change and give the full definition.

It also returns the metaframe and plugin sets, with the objects needed to e.g. add the iframe objects to the DOM.

This is the main event you should listen to if your metapage gets updated.

#### Metapage#ERROR

```ts
metapage.on('error', function(definition) { ... });
metapage.on(Metapage.ERROR, function(definition) { ... });

metapage.setDefinition(def :MetapageDefinition); // Fires above event
metapage.getDefinition(def) :MetapageDefinition;
```
The definition can be updated, this will fire on every change and give the full definition.



### Metapage.MetaframeClient

An internal object managing the data flow in and out of the actual metaframe iframe. You shouldn't need to access this object directly.
This object is in the *metapage* page, managing the metaframe data flow.

### Metapage.MetaframeClient#url

```ts
// The URL of the underlying iframe
const url :string = metapage.getMetaframe(id).url;
```

### Metapage.MetaframeClient#iframe

The concrete metaframe [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) HTML element.

### Metapage.MetaframeClient#dispose

```ts
metaframe.dispose()
```

Removes all event listeners and clears internal objects.

### Metapage.MetaframeClient#onInputs

```ts
metapage.get(metaframeId).onInputs(function(inputs) {...}): function():
```

Callback called on every input update event. Example `inputs` payload:

```js
{
  "inputPipeId1": "value"
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.get(metaframeId).on('inputs', function(inputs) {...}): function():
```


### Metapage.MetaframeClient#onOutputs

```ts
metapage.get(metaframeId).onOutputs(function(outputs) {...}): function():
```

Callback called on every output update event. Example `outputs` payload:

```js
{
  "outputPipeId1": "value"
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.get(metaframeId).on('outputs', function(outputs) {...}): function():
```




Metaframe
-----


A metaframe is a website running the metaframe library that adds input+output data pipes to the page.

Metaframes optionally have a `metaframe.json` definition at the URL path root, defining e.g. name, and the inputs and outputs. The definition is not *strictly* needed, however is is very helpful. Some metaframes, such as plugins, do require the `metaframe.json` to declare what inputs/outputs are allowed.

You need to specify a version. All metaframe versions will be compatible with all metapage versions, however some new functionality will obviously not be available with using older versions.

```json
{
	"version": "0.3",
	"metadata": {
		"title": "A button example",
		"author": "Dion Whitehead"
  },
  "inputs": {
		"input_name": {
			"type": "json"
		}
	},
	"outputs": {
		"output_name": {
			"type": "string"
		}
	}
}
```

Initialize a metaframe:
```ts
const metaframe = new Metaframe();
```

Wait until it has registered and established a connection with the parent *metapage*:
```ts
await metaframe.ready
```

or:

```ts
metaframe.ready.then(function(_) {
	//Do something, set inputs/outputs
});
```

### Metaframe#id

```ts
let s :String = metaframe.id;
```

The id the metapage assigned to this metaframe. Defaults to the key in the metapage definition.

### Metaframe#getInput

```ts
let inputValue = metaframe.getInput('inputName')
```

### Metaframe#getInputs

```ts
let inputValues = metaframe.getInputs()
```

Get a object of input pipe names mapped to values.

Do not modify the returned object! For efficiency purposes this is *not* a copy.

### Metaframe#getOutput

```ts
let output = metaframe.getOutput('outputName')
```

### Metaframe#getOutputs

```ts
let outputs = metaframe.getOutputs()
```

Do not modify the returned object! For efficiency purposes this is *not* a copy.


### Metaframe#onInputs

```ts
metaframe.onInputs(function(inputs) {...}): function():
```

Callback called on every input update event. Example `inputs` payload:

```js
{
  "inputPipeId1": "value"
}
```

Do not modify the returned object! For efficiency purposes this is *not* a copy.

An unbind function is returned.

### Metaframe#onInput

```ts
metaframe.onInput('inputName', function(value) {...}): function():
```

The callback will fire with the value of the input pipe on every update.


An unbind function is returned.

### Metaframe#setInput

```ts
metaframe.setInput('inputName', value :any)
```

### Metaframe#setOutput

```ts
metaframe.setOutput('outputName', value :any)
```

This value will be send to all downstream metaframe consumers.


### Metaframe#setOutput

```ts
metaframe.setOutputs(values :Object)
```

`values`: object mapping output names to values.

These values will be send to all downstream metaframe consumers.


### Metaframe#dispose

```ts
metaframe.dispose()
```

Removes window message listener, event listeners, and nulls potentially large fields.


# Plugins

Metapage plugins are metaframes that are not connected to the normal metaframes, instead they have hooks (via inputs) into:

 - metapage state changes (the metaframe inputs + outputs)
 - the metapage definition

Uses for the above include:

  - saving and restoring state changes
  - displaying representations of the definition (graph views, JSON editors)
  - others things currently outside my imagination

They are defined in the definition as unique URL to the plugin metaframe:

```json
{
    "metaframes": {
      ...
    },
    "plugins": [
      "https://plugin1.io",
      "https://plugin2.io?param1=value1"
    ]
      
}
```

The order of the plugins is usually the order displayed in the [app.metapages.org](https://app.metapages.org) UI.

The plugin URLs must be unique (even though they are defined in a list) and are not allowed to collide with the metaframe ids.

## Implenting a metapage plugin

Plugins declare which inputs they are allows to receive in the `metaframe.json` definition located at the base of the URL path. The outputs declare which values they will emit. All supported values are in this example plugin metaframe definition:

```json
{
	"version": "0.3",
	"metadata": {
		"title": "My metapage plugin"
	},
	"inputs": {
		"metapage/state": {
			"type": "json"
    },
    "metapage/definition": {
			"type": "json"
		}
  },
  "outputs": {
		"metapage/state": {
			"type": "json"
    },
    "metapage/definition": {
			"type": "json"
		}
	}
}
```


## Metaframe#plugin

The `plugin` field on the `metapage` object will be present if the metaframe is initialized as a plugin by the owning metapage:

```ts
metaframe.plugin
```

`metapage/definition` and `metapage/state` pipes may be listened to as per usual, or you may call the plugin methods:

## Metaframe#plugin.requestState
## Metaframe#plugin.onState

Requests the current state from the metapage.
```ts
metaframe.plugin.requestState(); // arrives via the next line
var disposeFunction = metaframe.plugin.onState(function(metapageState) { ... });

```

## Metaframe#plugin.setState

```ts
metaframe.plugin.setState(metapageState);
```

## Metaframe#plugin.onDefinition
## Metaframe#plugin.setDefinition
## Metaframe#plugin.getDefinition
```ts
var disposeFunction = metaframe.plugin.onDefinition(function(metapageDefinition) { ... });
metaframe.plugin.setDefinition(metapageDefinition);
var definition = metaframe.plugin.getDefinition);
```


## Metaframe#plugin pipes

`metapage/definition`: this input will always have the most recent metapage definition. If the output is set, the metapage will update the definition.  No action is needed to get this data.

`metapage/state`: this input has the metapage state. If the output is set, the metapage will update the entire application state. The `metapage/state` is not sent automatically, it must be requested every time:
