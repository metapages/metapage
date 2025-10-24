# [Metapages](https://docs.metapage.io/docs)

- Examples: [https://metapage.io](https://metapage.io)
- Documentation: [https://docs.metapage.io/docs](https://docs.metapage.io/docs)
- Online tests and conversion tools: [https://module.metapage.io](https://module.metapage.io)
- Example javascript component: [https://js.mtfm.io](https://js.mtfm.io)


A *metapage* is a set of connected iframes (*metaframes*).

Each component iframe runs the metapage module and establishes input/output pipes. Now you can create, edit, and embed whole complex applications directly in your own apps, or simply create using the [metapage editor]((https://metapage.io) and publish and share immediately.

## Quickstart metapage

Load and render a metapage definition

```javascript
import { renderMetapage } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.15";

// download a metapage definition from metapage.io
// or just use your own definition JSON
const response = await fetch("https://metapage.io/m/87ae11673508447e883b598bf7da9c5d/metapage.json");
const metapageDefinition = await response.json();
await renderMetapage({
	definition: metapageDefinition,
	rootDiv: document.getElementById('metapage-container')
});
```

The rendered workflow: 

![Logo](https://unpkg.com/@metapages/metapage/assets/example-01.png)



## Full example


```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        width: 100vw;
        height: 100vh;
      }

      iframe {
        overflow: hidden;
        border: 0;
        height: 100%;
        width: 100%;
      }
    </style>
  </head>

  <body>
    <div style="width: 100%; height: 100%" id="metapage-container"></div>

    <script type="module">
      // the only function you need to import to render a metapage
      import { renderMetapage } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.15";

      // download a metapage definition from metapage.io
      // or just use your own definition JSON
      const response = await fetch("https://metapage.io/m/87ae11673508447e883b598bf7da9c5d/metapage.json");
      const metapageDefinition = await response.json();

      // handle metapage outputs
      const onOutputs = (outputs) => {
        // do something with the outputs
        console.log("outputs", outputs);
      };
      // set input values with the provided setInputs function
      // dispose removes all event listeners and unloads the metapage
      const { setInputs, dispose } = await renderMetapage({
        definition: metapageDefinition,
        onOutputs,
        rootDiv: document.getElementById("metapage-container"),
        options: {
          hideBorder: true,
          hideFrameBorders: true,
          hideOptions: true,
          hideMetaframeLabels: true,
        },
      });
    </script>
  </body>
</html>

```
