---
title: api_0.1.35
permalink: /api/0.1.35/
version: 0.1.35
---

# API Reference v0.1.35

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
    "version": "0.1.0",
    "iframes": {
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

---

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


### Metapage#removeAll

```ts
metapage.removeAll()
```

Removes all metaframes, essentially resetting the metapage. It doesn't remove window listeners though, for proper disposal call `dispose()`.

### Metapage#setInput

```ts
metapage.setInput(metaframeId :String, inputPipeId :String, value :any)
```

Set the pipe input value for the given metaframe. It will get sent to the underlying iframe and metaframe object there.

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

### MetaframeClient

An internal object managing the data flow in and out of the actual metaframe iframe. You shouldn't need to access this object directly.

### MetaframeClient#iframe

The concrete metaframe [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) HTML element.
