---
layout: default-with-mermaid
title: api_0.2.0
permalink: /api/0.2.0/
nav_exclude: true
---

# API Reference v0.2.0
-----


MetapageDefinition<a name="metapagedefinition"></a>
-----

The JSON description consists of metaframes and the metaframe inputs.

Example minimal metapage with two metaframes:
<div class="language-mermaid">graph LR
metaframe1 -- "output1 -> input1" --> metaframe2
metaframe2 -- "data-stream"       --> metaframe1
</div>

Defined by:

```json
{
    "version": "0.2",
    "metaframes": {
      "metaframe1": {
        "url": "{{site.url}}/metaframes/example00_iframe1/",
        "inputs": [
          {
            "metaframe": "metaframe2",
            "source"   : "output1",
            "target"   : "input1"
          }
        ]
      },
      "metaframe2": {
        "url": "{{site.url}}/metaframes/example00_iframe2/",
        "inputs": [
          {
            "metaframe": "metaframe1",
            "source"   : "data-stream"
          }
        ]
      }
    }
}
```

<!-- {: .fs-5 .ls-10 .text-mono .code-example } -->

The `target` key of the `inputs` array element can be omitted if the value is the same as the `source` value.

`version`: This library hasn't reached version `"1"` yet. Backwards compatibility is built into this library from it's first release, and will be automated as much as possible. This is required to maintain long-term compatibility: metaframes should be useful forever, if that is possible from the content. Users should only need to upgrade for bug fixes, performance improvements, or to access new features, and there should never be cognitive load (no worries) about versioning for library users. Mistakes happen, no process is perfect, but this tool assumes the burden of handling all changes to versions over time.

---


Metapage
-----

A metapage manages piping metaframe outputs to metaframe inputs.

Ways to initialize a metapage:
1. Create a metapage from a [MetapageDefinition](#metapagedefinition) JSON object:
  ```ts
  const metapage = Metapage.from(def :MetapageDefinition, ?opts :Options): Metapage
  ```
2. Create an empty metapage via the constructor. Metaframes and pipes are added manually. This is mostly used for testing or debugging:
  ```ts
  const metapage = new Metapage(?opts :Options): Metapage
  ```

The optional ```opts``` argument defineds some extra options, mostly used for debugging:

```typescript
interface Options {
  color?: String;  // Color of console.logs, since all iframes and the main page will output logs to the same console
  id?   : String;  //Id, not required, but useful if you have multiple metapages in a single website.
}
```

If the URL has the parameter `MP_DEBUG` then debug logging is enabled: `https://domain.org/metapage1?MP_DEBUG`


### Metapage#addMetaframe

```ts
metapage.addMetaframe(url :String, ?iframeId :String): MetaframeClient
```

`url`: URL to a metaframe website

`iframeId`: optional

Add a new metaframe using the URL. Optionally provide a (locally unique to the metapage) id. If an id is not provided, one will be generated.

### Metapage#addPipe

```ts
metapage.addPipe(targetMetaframe :String, pipeInput :PipeInput)
```

`targetMetaframe`: metaframeId of the target metaframe

`pipeInput`: object describing the source metaframe, output pipe name, and input pipe name 
```js
{
  "metaframe": "<sourceMetaframeId>",
  "source": "<sourceMetaframePipeName>",
  "target": "<thisMetaframePipeName>",
}
```

`pipeInput.metaframe`: source metaframeId

`pipeInput.source`: source metaframe output pipe name. Can be `*` or any glob, this will forward all output pipes matching the glob

`pipeInput.target`: target metaframe input pipe name. If `target` is omitted, then the input pipe name will be the same as the output pipe name.


Add a new metaframe input pipe, from the source metaframes output `source`, to the target metaframes `target` input.

<div class="language-mermaid">graph LR
metaframeSource[pipeInput.metaframe] -- "pipeInput.source -> pipeInput.target" --> targetMetaframe
</div>


### Metapage#dispose

```ts
metapage.dispose()
```

Removes all metaframes, window listeners, event listeners.

### Metapage#get

```ts
metapage.get(metaframeId :String): MetaframeClient
```

Get the MetaframeClient for the given id.

### Metapage#iframes

```ts
metapage.iframes(): Map<String, IFrameElement>
```

Returns a plain Object with metaframe ids mapped to the underlying metaframe [iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).


### Metapage#metaframeIds

```ts
metapage.metaframeIds(): Array<String>
```

Returns an array of metaframe ids.


### Metapage#metaframes

```ts
metapage.metaframes(): Map<String, MetaframeClient>
```

Returns a plain Object with metaframe ids mapped to MetaframeClient objects.

### Metapage#onInputs

```ts
metapage.onInputs(function(inputs) {...}): function():
```

Callback called on every input update event. Example `inputs` payload:

```js
{
  "metaframeId1": {
    "inputPipeId1": "value"
  }
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.on('inputs', function(inputs) {...}): function():
```

You can also listen on the metaframe clients directly:

```ts
metapage.get(metaframeId).on('inputs', function(inputs) {...}): function():
```


### Metapage#onOutputs

```ts
metapage.onOutputs(function(outputs) {...}): function():
```

Callback called on every output update event. Example `outputs` payload:

```js
{
  "metaframeId1": {
    "outputPipeId1": "value"
  }
}
```

An unbind function is returned.

The same thing can be called via the event:

```ts
metapage.on('outputs', function(outputs) {...}): function():
```

You can also listen on the metaframe clients directly:

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

### Metapage events

Metapage event allows you to add hooks to the data flow:

```js
/**
 * Example update:
 * {
 *   "metaframe1": {
 *     "input1": "foobar",
 *     "input2": 3
 *   }
 * }
 */
metapage.on('inputs', function(update) {

});
```

Listens to changes in the `inputs` for metaframes. The listener is called on every discrete input update. 


```ts
/**
 * Example update:
 * {
 *   "metaframe1": {
 *     "output1": "foobar",
 *     "output2": 3
 *   }
 * }
 */
metapage.on('outputs', function(update) {
  
});
```

Listens to changes in the `outputs` for metaframes. The listener is called on every discrete output update. 

You can also just listen to a specific metaframe client:

```ts
/**
 * Example update:
 * {
*    "output1": "foobar",
 * }
 */
metapage.get(metaframeId).on('outputs', function(update) {
  
});
```

### Metapage.MetaframeClient

An internal object managing the data flow in and out of the actual metaframe iframe. You shouldn't need to access this object directly.
This object is in the *metapage* page, managing the metaframe data flow.

### Metapage.MetaframeClient#iframe

The concrete metaframe [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) HTML element.


<a href="{{site.url}}/api_previous_versions/">Previous Versions</a>

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

### Metaframe#name

```ts
let s :String = metaframe.name;
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
