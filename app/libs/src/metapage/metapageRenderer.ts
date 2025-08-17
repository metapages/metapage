import { MetapageEvents } from "./events.js";
import { Metapage } from "./Metapage.js";
import { pageLoaded } from "./MetapageTools.js";
import { MetapageInstanceInputs } from "./v0_4/index.js";
import { MetapageDefinitionV2 } from "./v2/metapage.js";

// Types for the pure function
export interface RenderingOptions {
  hideBorder?: boolean;
  hideFrameBorders?: boolean;
  hideOptions?: boolean;
  hideMetaframeLabels?: boolean;
  debug?: boolean;
  dividerIndex?: number;
}

export interface MetapageRendererResult {
  setInputs: (inputs: MetapageInstanceInputs) => void;
  dispose: () => void;
}

// Layout item type for internal use
interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Utility function to check if a metaframe is a divider
function isMetaframeDivider(url: string): boolean {
  if (!url.startsWith("data:")) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const mimetype = parsed.pathname.split(";")[0];
    return mimetype.split(";")[1] === "type=metapage-divider";
  } catch {
    return false;
  }
}

// Utility function to validate layout (simplified version)
function validateLayout(
  definition: MetapageDefinitionV2
): MetapageDefinitionV2 {
  // Create a deep copy to avoid mutating the original
  const validated = JSON.parse(JSON.stringify(definition));

  if (!validated.meta) {
    validated.meta = {};
  }

  if (!validated.meta.layouts) {
    validated.meta.layouts = {};
  }

  if (!validated.meta.layouts["react-grid-layout"]) {
    validated.meta.layouts["react-grid-layout"] = {
      docs: "https://www.npmjs.com/package/react-grid-layout",
      props: {
        cols: 12,
        margin: [20, 40],
        rowHeight: 100,
        containerPadding: [5, 5],
      },
      layout: [],
    };
  }

  const layout = validated.meta.layouts["react-grid-layout"];

  // Ensure all metaframes have layout entries
  if (validated.metaframes) {
    Object.keys(validated.metaframes).forEach((metaframeId) => {
      if (!layout.layout.some((l: LayoutItem) => l.i === metaframeId)) {
        const currentMaxY =
          layout.layout.length > 0
            ? Math.max(
                ...layout.layout.map((l: LayoutItem) => (l.y || 0) + (l.h || 2))
              )
            : 0;

        layout.layout.push({
          i: metaframeId,
          x: 0,
          y: currentMaxY,
          w: layout.props.cols,
          h: isMetaframeDivider(validated.metaframes[metaframeId].url) ? 1 : 3,
        });
      }
    });

    // Remove non-existent metaframes from layout
    const allMetaframeIds = new Set(Object.keys(validated.metaframes));
    layout.layout = layout.layout.filter((l: LayoutItem) =>
      allMetaframeIds.has(l.i)
    );

    // Ensure all layout items have valid numeric values
    layout.layout.forEach((l: LayoutItem) => {
      l.x = l.x || 0;
      l.y = l.y || 0;
      l.w = l.w || 1;
      l.h = l.h || 1;
    });
  }

  return validated;
}

/**
 * Pure function to render a metapage and return inputs function
 * This function creates a metapage instance, renders it to the DOM,
 * and returns a function to set inputs and a dispose function
 */
export async function renderMetapage(props: {
  definition: MetapageDefinitionV2;
  onOutputs?: (outputs: MetapageInstanceInputs) => void;
  rootDiv: HTMLElement;
  options?: RenderingOptions;
}): Promise<MetapageRendererResult> {
  // Validate and clean the definition
  const { definition, onOutputs, rootDiv, options = {} } = props;
  const validatedDefinition = validateLayout(definition);
  const processedDefinition = await processMetapage(validatedDefinition);

  // Wait for page to be loaded
  await pageLoaded();

  // Create metapage instance
  const metapage = new Metapage();
  metapage.debug = options.debug || false;

  try {
    await metapage.setDefinition(processedDefinition);
  } catch (err) {
    metapage.dispose();
    throw new Error(`Failed to set metapage definition: ${err}`);
  }

  // Set up event listeners
  const disposers: (() => void)[] = [];

  if (onOutputs) {
    disposers.push(
      metapage.addListenerReturnDisposer(MetapageEvents.Outputs, onOutputs)
    );
  }

  // Get the layout information
  const desktopLayoutBlob =
    processedDefinition?.meta?.layouts?.["react-grid-layout"];
  const layout = desktopLayoutBlob?.layout as LayoutItem[];

  if (!desktopLayoutBlob || !layout) {
    throw new Error("No valid layout found in metapage definition");
  }

  // Find dividers and determine which metaframes to hide
  const { metaframesToHide } = (() => {
    // Find all dividers and their y positions
    const dividers = layout
      .map((item: LayoutItem, index: number) => {
        const metaframe = metapage.getMetaframes()[item.i];
        return metaframe && isMetaframeDivider(metaframe.url)
          ? { index, y: item.y, id: item.i }
          : null;
      })
      .filter(
        (item): item is { index: number; y: number; id: string } =>
          item !== null
      );

    // If no dividers found, return empty list
    if (dividers.length === 0) return { metaframesToHide: new Set<string>() };

    // Find the divider with the lowest y value
    const lowestYDivider = dividers.reduce(
      (
        lowest: { index: number; y: number; id: string },
        current: { index: number; y: number; id: string }
      ) => (current.y < lowest.y ? current : lowest)
    );

    // Create a set of metaframe IDs to hide (divider and those below it)
    const metaframesToHide = new Set<string>();
    const dividerY =
      layout.find((item: LayoutItem) => item.i === lowestYDivider.id)?.y ?? 0;

    // Add all metaframes at or below the divider's y position
    layout.forEach((item: LayoutItem) => {
      if (item.y >= dividerY) {
        metaframesToHide.add(item.i);
      }
    });

    return { metaframesToHide };
  })();

  // Get visible metaframes
  const visibleMetaframeIds = Object.keys(metapage.getMetaframes()).filter(
    (metaframeId) => !metaframesToHide.has(metaframeId)
  );

  // Calculate grid dimensions based on visible metaframes only
  const visibleLayoutItems = layout.filter((item: LayoutItem) =>
    visibleMetaframeIds.includes(item.i)
  );
  const maxCol = Math.max(
    ...visibleLayoutItems.map((item: LayoutItem) => item.x + item.w)
  );
  const maxRow = Math.max(
    ...visibleLayoutItems.map((item: LayoutItem) => item.y + item.h)
  );

  // Create grid container style
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
    gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
    gap: `${desktopLayoutBlob.props.margin?.[0] || 10}px`,
    width: "100%",
    height: "100%",
    padding: desktopLayoutBlob.props.containerPadding?.[0] || 0,
    minHeight: 0,
    alignContent: "stretch",
  };

  // Container style to ensure it fits within window height
  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  };

  // Clear the root div
  rootDiv.innerHTML = "";

  // Create container
  const container = document.createElement("div");
  Object.assign(container.style, containerStyle);

  // Create grid container
  const gridContainer = document.createElement("div");
  Object.assign(gridContainer.style, gridStyle);

  // Add visible metaframes to the grid
  visibleMetaframeIds.forEach((metaframeId, index) => {
    const layoutItem = layout.find(
      (item: LayoutItem) => item.i === metaframeId
    );
    if (!layoutItem) return;

    const metaframe = metapage.getMetaframes()[metaframeId];
    if (!metaframe) return;

    const itemStyle: Record<string, string | number> = {
      gridColumn: `${layoutItem.x + 1} / span ${layoutItem.w}`,
      gridRow: `${layoutItem.y + 1} / span ${layoutItem.h}`,
      overflow: "hidden",
      width: "100%",
      minHeight: "100%",
      height: "100%",
      border: options.hideFrameBorders ? "none" : "1px solid #e0e0e0",
    };

    // Create iframe for the metaframe
    const iframe = document.createElement("iframe");
    iframe.src = metaframe.url;
    iframe.style.border = "none";
    Object.assign(iframe.style, itemStyle);

    gridContainer.appendChild(iframe);
  });

  // Create hidden container for hidden metaframes
  const hiddenContainer = document.createElement("div");
  hiddenContainer.style.display = "none";

  // Add hidden metaframes
  Object.keys(metapage.getMetaframes())
    .filter((metaframeId) => metaframesToHide.has(metaframeId))
    .forEach((metaframeId) => {
      const metaframe = metapage.getMetaframes()[metaframeId];
      if (!metaframe) return;

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-metaframe-id", metaframeId);

      const iframe = document.createElement("iframe");
      iframe.src = metaframe.url;
      iframe.style.border = "none";
      iframe.style.height = "100%";
      iframe.style.width = "100%";
      iframe.style.overflow = "clip";

      wrapper.appendChild(iframe);
      hiddenContainer.appendChild(wrapper);
    });

  // Assemble the DOM
  container.appendChild(gridContainer);
  container.appendChild(hiddenContainer);
  rootDiv.appendChild(container);

  // Return the inputs function and dispose function
  return {
    setInputs: (inputs: MetapageInstanceInputs) => {
      if (!metapage.isDisposed()) {
        metapage.setInputs(inputs);
      }
    },
    dispose: () => {
      // Clean up event listeners
      disposers.forEach((disposer) => disposer());
      // Dispose the metapage
      metapage.dispose();
      // Clear the DOM
      rootDiv.innerHTML = "";
    },
  };
}

const getMetaframeKey = (url: string | URL): string | undefined => {
  if (!url) {
    return undefined;
  }
  if (typeof url === "string") {
    if (url.startsWith("/")) {
      url = "https://metapage.io" + url;
    }
    url = new URL(url);
  }

  let mfk = /\/m?f\/([0-9a-zA-Z-]{3,})\/?(metaframe\.json)?.*$/g.exec(
    url.pathname
  )?.[1];
  if (mfk) {
    return mfk;
  }
  return url.searchParams.get("mfk") ?? undefined;
};

const processMetapage = async (
  metapageDefinition: MetapageDefinitionV2
): Promise<MetapageDefinitionV2> => {
  if (!metapageDefinition?.metaframes) {
    return metapageDefinition;
  }
  for (const [metaframeId, metaframe] of Object.entries(
    metapageDefinition.metaframes
  )) {
    // ignore non-prod non-synced metaframes
    if (
      !(
        metaframe.url.startsWith("https://metapage.io/mf/") ||
        metaframe.url.startsWith("https://metapage.io/f/")
      )
    ) {
      continue;
    }
    const mfk = getMetaframeKey(metaframe.url);
    if (!mfk) {
      continue;
    }
    const metaframeDefinition = await fetch(
      `https://metapage.io/f/${mfk}/definition.json`
    ).then((r) => r.json());
    if (metaframeDefinition?.url) {
      metaframe.url = metaframeDefinition?.url;
    }
  }
  return metapageDefinition;
};
