import { MetapageEvents } from './events.js';
import { Metapage } from './Metapage.js';
import { pageLoaded } from './MetapageTools.js';
import { getMetapageDefinitionFromUrl } from './util.js';
import { MetapageInstanceInputs } from './v0_4/index.js';
import { MetapageDefinitionV2 } from './v2/metapage.js';

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
  return url.includes("type=metapage-divider");
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
  url?: string;
  definition?: MetapageDefinitionV2;
  onOutputs?: (outputs: MetapageInstanceInputs) => void;
  rootDiv: HTMLElement;
  options?: RenderingOptions;
}): Promise<MetapageRendererResult> {
  // Validate and clean the definition
  let { url, definition, onOutputs, rootDiv, options = {} } = props;
  if (!url && !definition) {
    throw new Error("Either url or definition must be provided");
  }
  if (url && definition) {
    throw new Error("Either url or definition must be provided, not both");
  }

  if (url) {
    definition = await getMetapageDefinitionFromUrl(url);
  }

  if (!definition) {
    throw new Error("Failed to fetch metapage definition");
  }

  definition = validateLayout(definition);
  definition = await processMetapage(definition);

  // Wait for page to be loaded
  await pageLoaded();

  // Create metapage instance
  const metapage = new Metapage();
  metapage.debug = options.debug || false;

  try {
    await metapage.setDefinition(JSON.parse(JSON.stringify(definition)));
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
  const desktopLayoutBlob = definition?.meta?.layouts?.["react-grid-layout"];
  const layout = desktopLayoutBlob?.layout as LayoutItem[];

  if (!desktopLayoutBlob || !layout) {
    throw new Error("No valid layout found in metapage definition");
  }

  // Find dividers and determine which metaframes to hide
  const metaframesToHide = new Set<string>();
  
  // Find all dividers and their y positions
  const dividers = layout
    .map((item: LayoutItem, index: number) => {
      const metaframe = metapage.getMetaframes()[item.i];
      return metaframe && isMetaframeDivider(metaframe.url)
        ? { index, y: item.y, id: item.i }
        : null;
    })
    .filter(
      (item): item is { index: number; y: number; id: string } => item !== null
    );

  // If dividers found, determine which metaframes to hide
  if (dividers.length > 0) {
    // Find the divider with the lowest y value
    const lowestYDivider = dividers.reduce(
      (
        lowest: { index: number; y: number; id: string },
        current: { index: number; y: number; id: string }
      ) => (current.y < lowest.y ? current : lowest)
    );

    const dividerY =
      layout.find((item: LayoutItem) => item.i === lowestYDivider.id)?.y ?? 0;

    // Add all metaframes at or below the divider's y position
    layout.forEach((item: LayoutItem) => {
      if (item.y >= dividerY) {
        metaframesToHide.add(item.i);
      }
    });
  }

  // Get visible metaframes
  const visibleMetaframeIds = metapage
    .getMetaframeIds()
    .filter((metaframeId) => !metaframesToHide.has(metaframeId));

  // Calculate grid dimensions based on visible metaframes only
  let visibleLayoutItems = layout.filter((item: LayoutItem) =>
    visibleMetaframeIds.includes(item.i)
  );
  
  // Handle case where no metaframes are visible
  if (visibleLayoutItems.length === 0) {
    // Return early with empty result
    return {
      setInputs: (inputs: MetapageInstanceInputs) => {
        if (!metapage.isDisposed()) {
          metapage.setInputs(inputs);
        }
      },
      dispose: () => {
        disposers.forEach((disposer) => disposer());
        metapage.dispose();
        rootDiv.innerHTML = "";
      },
    };
  }
  
  // Sort visible layout items by y position to ensure proper grid layout
  visibleLayoutItems.sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
  
  // Create grid container style (will be updated after we know the actual dimensions)
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(1, 1fr)", // Placeholder, will be updated
    gridAutoRows: "1fr", // Use fractional units to distribute available height
    gap: `${desktopLayoutBlob.props.margin?.[0] || 10}px`,
    width: "100%",
    height: "100%",
    maxHeight: "100%", // Constrain to parent height
    padding: desktopLayoutBlob.props.containerPadding?.[0] || 0,
    minHeight: 0,
    alignContent: "start",
    alignItems: "start",
    overflow: "hidden", // Prevent grid from expanding beyond container
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
  const renderedMetaframes: LayoutItem[] = [];
  
  for (const metaframeId of visibleMetaframeIds) {
  
    const layoutItem = layout.find(
      (item: LayoutItem) => item.i === metaframeId
    );
    if (!layoutItem) continue;

    const metaframe = metapage.getMetaframes()[metaframeId];
    const iframe = await metaframe.iframe
    if (!metaframe) continue;
    
    // Track this metaframe for grid dimension calculation
    renderedMetaframes.push(layoutItem);

    const itemStyle: Record<string, string | number> = {
      gridColumn: `${layoutItem.x + 1} / span ${layoutItem.w}`,
      gridRow: `${layoutItem.y + 1} / span ${layoutItem.h}`,
      overflow: "hidden",
      width: "100%",
      height: "100%", // Use full height of grid cell
      border: options.hideFrameBorders ? "none" : "1px solid #e0e0e0",
      position: "relative" as const,
      alignSelf: "stretch", // Stretch to fill the grid cell height
      justifySelf: "stretch", // Stretch to fill the grid cell width
    };
    
    // Create wrapper div for proper grid positioning
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, itemStyle);
    wrapper.appendChild(iframe);
    
    gridContainer.appendChild(wrapper);
  }

  // Now calculate grid dimensions based on actually rendered metaframes
  const maxCol = Math.max(
    ...renderedMetaframes.map((item: LayoutItem) => item.x + item.w)
  );

  
  const maxRow = Math.max(
    ...renderedMetaframes.map((item: LayoutItem) => item.y + item.h)
  );
  
  
  // Update the grid container with the correct dimensions
  gridContainer.style.gridTemplateColumns = `repeat(${Math.max(1, maxCol)}, 1fr)`;

  // Create hidden container for hidden metaframes
  const hiddenContainer = document.createElement("div");
  hiddenContainer.style.position = "absolute";
  hiddenContainer.style.top = "-9999px";
  hiddenContainer.style.left = "-9999px";
  hiddenContainer.style.width = "1px";
  hiddenContainer.style.height = "1px";
  hiddenContainer.style.overflow = "hidden";
  hiddenContainer.style.pointerEvents = "none";

  // Add hidden metaframes
  for (const metaframeId of Object.keys(metapage.getMetaframes()).filter((id) => metaframesToHide.has(id))) {
    const metaframe = metapage.getMetaframes()[metaframeId];
    if (!metaframe) continue;

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-metaframe-id", metaframeId);
    wrapper.style.width = "100px"; // Give enough space for iframe to be active
    wrapper.style.height = "100px";

    // Use the metaframe's iframe if available, otherwise create one
    let iframe: HTMLIFrameElement;
    if (metaframe.iframe) {
      iframe = await metaframe.iframe;
    } else {
      iframe = document.createElement("iframe");
      iframe.src = metaframe.url;
      iframe.style.border = "none";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
    }

    wrapper.appendChild(iframe);
    hiddenContainer.appendChild(wrapper);
  }

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
