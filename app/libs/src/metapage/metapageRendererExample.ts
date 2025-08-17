import {
  MetapageDefinitionV2,
  MetapageInstanceInputs,
} from "@metapages/metapage";

import { RenderingOptions, renderMetapage } from "./metapageRenderer";

/**
 * Example usage of the pure renderMetapage function
 * This demonstrates how third-party modules can use the function
 * without any React or other framework dependencies
 */

// Example metapage definition
const exampleDefinition: MetapageDefinitionV2 = {
  version: "2",
  metaframes: {
    chart: {
      url: "https://example.com/chart-widget",
      inputs: [],
    },
    "data-table": {
      url: "https://example.com/data-table",
      inputs: [],
    },
    controls: {
      url: "https://example.com/controls",
      inputs: [],
    },
  },
  meta: {
    layouts: {
      "react-grid-layout": {
        layout: [
          { i: "controls", x: 0, y: 0, w: 12, h: 2 },
          { i: "chart", x: 0, y: 2, w: 8, h: 6 },
          { i: "data-table", x: 8, y: 2, w: 4, h: 6 },
        ],
        props: {
          cols: 12,
          margin: [10, 10],
          rowHeight: 100,
          containerPadding: [5, 5],
        },
      },
    },
  },
};

// Example rendering options
const renderingOptions: RenderingOptions = {
  hideBorder: false,
  hideFrameBorders: false,
  hideOptions: true,
  hideMetaframeLabels: true,
  debug: false,
};

// Example output handler
function handleOutputs(outputs: MetapageInstanceInputs) {
  console.log("Metapage outputs:", outputs);

  // Handle specific outputs
  if (outputs.chart?.data) {
    console.log("Chart data received:", outputs.chart.data);
  }

  if (outputs.controls?.filter) {
    console.log("Filter value received:", outputs.controls.filter);
  }
}

// Example usage function
export async function renderExampleMetapage(containerId: string) {
  try {
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    // Render the metapage
    const result = await renderMetapage({
      definition: exampleDefinition,
      onOutputs: handleOutputs,
      rootDiv: container,
      options: renderingOptions,
    });

    // Example: Set some inputs after rendering
    setTimeout(() => {
      result.setInputs({
        chart: {
          data: { x: [1, 2, 3], y: [10, 20, 30] },
        },
        controls: {
          filter: "all",
        },
      });
    }, 1000);

    // Example: Clean up after some time (in real usage, you'd do this when appropriate)
    // setTimeout(() => {
    //   result.dispose();
    // }, 60000); // Clean up after 1 minute

    return result;
  } catch (error) {
    console.error("Failed to render metapage:", error);
    throw error;
  }
}

// Example of how to use in a module
export class MetapageWidget {
  private result: any = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(definition: MetapageDefinitionV2, options?: RenderingOptions) {
    // Clean up any existing metapage
    if (this.result) {
      this.result.dispose();
    }

    // Render new metapage
    this.result = await renderMetapage({
      definition,
      onOutputs: this.handleOutputs.bind(this),
      rootDiv: this.container,
    });

    return this.result;
  }

  setInputs(inputs: MetapageInstanceInputs) {
    if (this.result) {
      this.result.inputs(inputs);
    }
  }

  dispose() {
    if (this.result) {
      this.result.dispose();
      this.result = null;
    }
  }

  private handleOutputs(outputs: MetapageInstanceInputs) {
    // Handle outputs specific to this widget
    console.log("Widget outputs:", outputs);

    // Emit custom events or call callbacks as needed
    this.container.dispatchEvent(
      new CustomEvent("metapage-outputs", {
        detail: outputs,
      })
    );
  }
}
