import { Disposer } from "./core.js";
import { MetapageEventDefinitionUpdate, MetapageEvents } from "./events.js";
import { Metapage } from "./Metapage.js";
import { pageLoaded } from "./MetapageTools.js";
import { MetaframeInputMap } from "./v0_4/index.js";
import { MetapageDefinition } from "./v2/metapage.js";

const METAFRAME_ID = "mf";

export interface MetaframeRendererResult {
  setInputs: (inputs: MetaframeInputMap) => void;
  setOutputs: (outputs: MetaframeInputMap) => void;
  dispose: Disposer;
  metapage: Metapage;
}

/**
 * Renders a single metaframe URL as a full-size iframe.
 * Creates a minimal metapage definition wrapping the URL,
 * then renders the iframe at 100% width/height with no
 * borders, labels, or grid layout.
 */
export async function renderMetaframe(props: {
  url: string;
  onOutputs?: (outputs: MetaframeInputMap) => void;
  onUrlChange?: (url: string) => void;
  rootDiv: HTMLElement;
  debug?: boolean;
}): Promise<MetaframeRendererResult> {
  const { url, onOutputs, onUrlChange, rootDiv, debug = false } = props;

  if (!url) {
    throw new Error("url must be provided");
  }

  // Build a minimal metapage definition with a single metaframe
  const definition: MetapageDefinition = {
    version: "0.4",
    metaframes: {
      [METAFRAME_ID]: { url },
    },
    meta: {
      layouts: {
        "react-grid-layout": {
          docs: "https://www.npmjs.com/package/react-grid-layout",
          props: {
            cols: 1,
            margin: [0, 0],
            rowHeight: 100,
            containerPadding: [0, 0],
          },
          layout: [{ i: METAFRAME_ID, x: 0, y: 0, w: 1, h: 1 }],
        },
      },
    },
  };

  await pageLoaded();

  const metapage = new Metapage();
  metapage.debug = debug;

  try {
    await metapage.setDefinition(JSON.parse(JSON.stringify(definition)));
  } catch (err) {
    metapage.dispose();
    throw new Error(`Failed to set metapage definition: ${err}`);
  }

  const disposers: Disposer[] = [];

  if (onOutputs) {
    disposers.push(
      metapage.addListenerReturnDisposer(MetapageEvents.Outputs, (outputs) => {
        onOutputs(outputs[METAFRAME_ID] || {});
      }),
    );
  }

  if (onUrlChange) {
    let lastUrl = url;
    disposers.push(
      metapage.addListenerReturnDisposer(
        MetapageEvents.DefinitionUpdate,
        (event: MetapageEventDefinitionUpdate) => {
          const newUrl = event.definition?.metaframes?.[METAFRAME_ID]?.url;
          if (newUrl && newUrl !== lastUrl) {
            lastUrl = newUrl;
            onUrlChange(newUrl);
          }
        },
      ),
    );
  }

  // Get the single metaframe's iframe
  const metaframe = metapage.getMetaframes()[METAFRAME_ID];
  if (!metaframe) {
    metapage.dispose();
    throw new Error("Failed to create metaframe");
  }

  const iframe = await metaframe.iframe;

  // Container fills the rootDiv completely
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.overflow = "hidden";
  container.style.position = "relative";

  // Iframe fills the container
  iframe.style.position = "absolute";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.margin = "0";
  iframe.style.padding = "0";

  container.appendChild(iframe);
  rootDiv.appendChild(container);

  return {
    metapage,
    setInputs: (inputs: MetaframeInputMap) => {
      if (!metapage.isDisposed()) {
        metapage.setInputs({ [METAFRAME_ID]: inputs });
      }
    },
    setOutputs: (outputs: MetaframeInputMap) => {
      if (!metapage.isDisposed()) {
        metapage.setOutputs({ [METAFRAME_ID]: outputs });
      }
    },
    dispose: () => {
      disposers.forEach((disposer) => disposer());
      metapage.dispose();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
  };
}
