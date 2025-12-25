# @metapages/metapage

> Build composable, interconnected web applications using iframes and data pipes

[![npm version](https://badge.fury.io/js/%40metapages%2Fmetapage.svg)](https://www.npmjs.com/package/@metapages/metapage)

**@metapages/metapage** is a JavaScript library that lets you create and embed interactive workflows in the browser by connecting independent iframe components together through input/output data pipes.

## Quick Links

- 📚 [Full Documentation](https://docs.metapage.io/docs)
- 🎨 [Live Examples](https://metapage.io)
- 🛠️ [Interactive Tools](https://module.metapage.io)
- 💻 [Example Component](https://js.mtfm.io)

## What is this?

A **metapage** is a web application made up of connected iframes called **metaframes**. Each metaframe can:

- Receive data from other metaframes (inputs)
- Send data to other metaframes (outputs)
- Run independently (JavaScript, Docker containers, markdown editors, or any web component)

Think of it like a visual programming environment where each component is a full web application that can communicate with others through simple JSON data pipes.

## Installation

```bash
npm install @metapages/metapage
```

Or use directly from CDN:

```javascript
import { renderMetapage, Metapage, Metaframe } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";
```

## Quick Start

### Rendering a Metapage

The simplest way to embed a workflow is using `renderMetapage`:

```javascript
import { renderMetapage } from "@metapages/metapage";

// Fetch a metapage definition (or define your own JSON)
const response = await fetch(
  "https://metapage.io/m/87ae11673508447e883b598bf7da9c5d/metapage.json"
);
const definition = await response.json();

// Render it
const { setInputs, dispose } = await renderMetapage({
  definition,
  rootDiv: document.getElementById("container"),
});
```

The `renderMetapage` function the `react-grid-layout` layout in `metapage.json`:
```json
{
  "meta": {
    "layouts": {
      "react-grid-layout": {
        ...
      }
    }
  }
}
```
[Implentation in source code](https://github.com/metapages/metapage/blob/2ef8bd7bfb151ad1616da46aa9797bcf2b1c3d78/app/libs/src/metapage/metapageRenderer.ts#L204)



### Creating a Metaframe (Inside an iframe)

If you're building a component to use in a metapage:

```javascript
import { Metaframe } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

const metaframe = new Metaframe();

// Listen for input data from other metaframes
metaframe.onInput("data", (value) => {
  console.log("Received:", value);
  // Process the data and send output
  metaframe.setOutput("result", value.toUpperCase());
});

// Or listen to all inputs at once
metaframe.onInputs((inputs) => {
  console.log("All inputs:", inputs);
});
```

## Core Concepts

### Metapage Definition

A metapage is defined using JSON that specifies which metaframes to load and how they connect:

```javascript
{
  "version": "2",
  "metaframes": {
    "input": {
      "url": "https://editor.mtfm.io/#?hm=disabled"
    },
    "processor": {
      "url": "https://js.mtfm.io/",
      "inputs": [
        {
          "metaframe": "input",
          "source": "text",
          "target": "code"
        }
      ]
    },
    "output": {
      "url": "https://markdown.mtfm.io/",
      "inputs": [
        {
          "metaframe": "processor",
          "source": "output"
        }
      ]
    }
  }
}
```

This creates a pipeline: `input` → `processor` → `output`

### Data Pipes

Pipes connect metaframe outputs to other metaframe inputs:

```javascript
{
  "metaframe": "sourceMetaframeId",  // Where data comes from
  "source": "outputPipeName",         // Name of the output pipe
  "target": "inputPipeName"           // Name of the input pipe (optional, defaults to source)
}
```

### Working with Data

The library automatically handles serialization of complex data types:

```javascript
// In a metaframe - these are automatically serialized when sent between iframes
metaframe.setOutput("file", new File([blob], "data.txt"));
metaframe.setOutput("binary", new Uint8Array([1, 2, 3]));
metaframe.setOutput("buffer", arrayBuffer);

// And automatically deserialized when received
metaframe.onInput("file", (file) => {
  console.log(file instanceof File); // true
});
```

## Usage Examples

### Full HTML Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; padding: 0; width: 100vw; height: 100vh; }
      #metapage-container { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="metapage-container"></div>

    <script type="module">
      import { renderMetapage } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

      const definition = await fetch(
        "https://metapage.io/m/87ae11673508447e883b598bf7da9c5d/metapage.json"
      ).then(r => r.json());

      const { setInputs, dispose, metapage } = await renderMetapage({
        definition,
        rootDiv: document.getElementById("metapage-container"),
        onOutputs: (outputs) => {
          console.log("Metaframe outputs:", outputs);
        },
        options: {
          hideFrameBorders: true,
          hideOptions: true,
        }
      });

      // Send inputs to metaframes
      setInputs({
        "metaframeId": {
          "inputPipeName": "some value"
        }
      });

      // Clean up when done
      // dispose();
    </script>
  </body>
</html>
```

### Building a Metaframe Component

```javascript
import { Metaframe } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

const metaframe = new Metaframe();

// Handle inputs
metaframe.onInputs((inputs) => {
  const { data, config } = inputs;

  // Process inputs
  const result = processData(data, config);

  // Send outputs
  metaframe.setOutputs({
    result: result,
    timestamp: Date.now()
  });
});

// Individual input listener
metaframe.onInput("reset", () => {
  metaframe.setOutputs({});
});

// Get a specific input value
const currentValue = metaframe.getInput("data");

// Get all inputs
const allInputs = metaframe.getInputs();

// Clean up
metaframe.dispose();
```

### Programmatic Metapage Control

```javascript
import { Metapage } from "@metapages/metapage";

const metapage = new Metapage({
  definition: {
    version: "2",
    metaframes: {
      viewer: {
        url: "https://markdown.mtfm.io/"
      }
    }
  }
});

// Listen to metaframe outputs
metapage.on(Metapage.OUTPUTS, (outputs) => {
  console.log("Outputs from all metaframes:", outputs);
});

// Set inputs to metaframes
await metapage.setInputs({
  viewer: {
    text: "# Hello World"
  }
});

// Get current outputs
const outputs = metapage.getState().metaframes.outputs;

// Clean up
metapage.dispose();
```

## Advanced Features

### Hash Parameters in Metaframes

Metaframes can read and write to their URL hash parameters:

```javascript
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueJsonInWindow
} from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

// Read from URL hash
const config = getHashParamValueJsonFromWindow("config");

// Write to URL hash
setHashParamValueJsonInWindow("config", { theme: "dark" });
```

### Pattern Matching in Pipes

Use glob patterns to match multiple outputs:

```javascript
{
  "inputs": [
    {
      "metaframe": "source",
      "source": "data/*",     // Matches data/foo, data/bar, etc.
      "target": "inputs/"
    }
  ]
}
```

### Binary Data Handling

```javascript
// Send binary data
const imageData = await fetch("/image.png").then(r => r.arrayBuffer());
metaframe.setOutput("image", imageData);

// Receive and use
metaframe.onInput("image", async (data) => {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  document.getElementById("img").src = url;
});
```

## API Overview

### renderMetapage(options)

Render a metapage into a DOM element.

**Parameters:**
- `definition`: Metapage definition object
- `rootDiv`: DOM element to render into
- `onOutputs`: Callback for metaframe outputs (optional)
- `options`: Rendering options (optional)
  - `hideBorder`: Hide metapage border
  - `hideFrameBorders`: Hide individual metaframe borders
  - `hideOptions`: Hide options panel
  - `hideMetaframeLabels`: Hide metaframe labels

**Returns:** `{ setInputs, setOutputs, dispose, metapage }`

### Metapage Class

**Methods:**
- `setInputs(inputs)`: Set inputs for metaframes
- `getState()`: Get current state (inputs/outputs)
- `dispose()`: Clean up and remove all listeners
- `on(event, handler)`: Listen to events

**Events:**
- `Metapage.OUTPUTS`: When metaframe outputs change
- `Metapage.INPUTS`: When metapage inputs change
- `Metapage.DEFINITION`: When definition changes

### Metaframe Class

**Methods:**
- `setOutput(name, value)`: Set a single output
- `setOutputs(outputs)`: Set multiple outputs
- `getInput(name)`: Get a single input value
- `getInputs()`: Get all input values
- `onInput(name, callback)`: Listen to specific input
- `onInputs(callback)`: Listen to all inputs
- `dispose()`: Clean up

**Properties:**
- `id`: Metaframe ID assigned by parent metapage
- `isInputOutputBlobSerialization`: Enable/disable automatic binary serialization

## Creating Your Own Metaframes

Any web application can become a metaframe by:

1. Loading the library
2. Creating a `Metaframe` instance
3. Listening for inputs
4. Sending outputs

Example minimal metaframe:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Metaframe</title>
</head>
<body>
  <script type="module">
    import { Metaframe } from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

    const metaframe = new Metaframe();

    metaframe.onInputs((inputs) => {
      // Your logic here
      metaframe.setOutput("result", "processed: " + JSON.stringify(inputs));
    });
  </script>
</body>
</html>
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import {
  Metapage,
  Metaframe,
  MetapageDefinitionV2,
  MetaframeInputMap,
  MetapageInstanceInputs
} from "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.8.35";

const definition: MetapageDefinitionV2 = {
  version: "2",
  metaframes: {
    example: {
      url: "https://example.com"
    }
  }
};

const metapage = new Metapage({ definition });
```

## Browser Support

- Chrome 78+
- Modern browsers with ES2020 support
- ES modules required

## License

Apache-2.0

## Contributing

Issues and pull requests welcome at [https://github.com/metapages/metapage](https://github.com/metapages/metapage)

## More Resources

- [Documentation](https://docs.metapage.io)
- [Examples Gallery](https://metapage.io)
- [Create Metaframes](https://js.mtfm.io)
- [Community](https://github.com/metapages/metapage/discussions)
