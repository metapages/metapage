/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it, afterEach } from "vitest";
import {
  Metapage,
  MetapageDefinition,
  MetapageEventDefinitionUpdate,
  MetapageEvents,
  MetaframeInputMap,
  MetapageInstanceInputs,
  MetapageState,
} from "../src";

const PASSTHROUGH_URL = "https://metapage.io/metaframes/passthrough-markdown/";

// Register listener BEFORE calling updateDefinition so we don't miss the
// asynchronous (setTimeout 0) event, and auto-remove after first fire.
function nextDefinitionUpdate(
  mp: Metapage,
): Promise<MetapageEventDefinitionUpdate> {
  return new Promise((resolve) => {
    const handler = (event: MetapageEventDefinitionUpdate) => {
      mp.removeListener(Metapage.DEFINITION_UPDATE as any, handler);
      resolve(event);
    };
    mp.addListener(Metapage.DEFINITION_UPDATE as any, handler);
  });
}

function nextState(mp: Metapage): Promise<MetapageState> {
  return new Promise((resolve) => {
    const handler = (state: MetapageState) => {
      mp.removeListener(Metapage.STATE as any, handler);
      resolve(state);
    };
    mp.addListener(Metapage.STATE as any, handler);
  });
}

describe("Metapage.updateDefinition", () => {
  let metapage: Metapage;

  afterEach(() => {
    if (metapage && !metapage.isDisposed()) {
      metapage.dispose();
    }
  });

  it("first call fires DefinitionUpdate event (unlike setDefinition)", async () => {
    metapage = new Metapage();

    const definition: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const eventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(definition);
    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.definition).toBeDefined();
  });

  it("event payload .metaframes.added contains new metaframe IDs", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    // Wait for first event to complete before second call
    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    const eventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    const event = await eventPromise;

    expect(event.metaframes.added).toBeDefined();
    expect(Object.keys(event.metaframes.added)).toContain("frame2");
    expect(Object.keys(event.metaframes.added)).not.toContain("frame1");
  });

  it("event payload .metaframes.removed contains removed metaframe IDs", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    // Wait for first event to complete before second call
    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const eventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    const event = await eventPromise;

    expect(event.metaframes.removed).toBeDefined();
    expect(Object.keys(event.metaframes.removed)).toContain("frame2");
    expect(Object.keys(event.metaframes.removed)).not.toContain("frame1");
  });

  it("event payload .metaframes.current matches getMetaframes() after update", async () => {
    metapage = new Metapage();

    const definition: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    const eventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(definition);
    const event = await eventPromise;

    const currentMetaframes = metapage.getMetaframes();
    expect(Object.keys(event.metaframes.current)).toEqual(
      Object.keys(currentMetaframes),
    );
  });

  it("calling with same definition still fires event with empty added/removed", async () => {
    metapage = new Metapage();

    const definition: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    // Wait for first event to complete before second call
    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(definition);
    await firstEventPromise;

    // Second call with same definition
    const eventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(definition);
    const event = await eventPromise;

    expect(Object.keys(event.metaframes.added)).toHaveLength(0);
    expect(Object.keys(event.metaframes.removed)).toHaveLength(0);
  });

  it("passing state emits both DefinitionUpdate and State events", async () => {
    metapage = new Metapage();

    const definition: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const state: MetapageState = {
      metaframes: {
        inputs: { frame1: { key: "value" } },
        outputs: {},
      },
    };

    const definitionUpdatePromise = nextDefinitionUpdate(metapage);
    const statePromise = nextState(metapage);

    await metapage.updateDefinition(definition, state);

    const [definitionEvent, stateEvent] = await Promise.all([
      definitionUpdatePromise,
      statePromise,
    ]);

    expect(definitionEvent).toBeDefined();
    expect(stateEvent).toBeDefined();
  });

  it("State event fires when metaframes are added, even without explicit state param", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    // Wait for first event to complete before second call
    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    const statePromise = nextState(metapage);
    await metapage.updateDefinition(def2);
    const stateEvent = await statePromise;

    expect(stateEvent).toBeDefined();
  });

  it("State event fires when metaframes are removed, even without explicit state param", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    // Wait for first event to complete before second call
    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const statePromise = nextState(metapage);
    await metapage.updateDefinition(def2);
    const stateEvent = await statePromise;

    expect(stateEvent).toBeDefined();
  });

  it("new connections added via updateDefinition route data correctly", async () => {
    metapage = new Metapage();

    // Start with two frames, NO connections between them
    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Verify no connections: setting output on frame1 should NOT reach frame2
    const frame2Before = metapage.getMetaframe("frame2")!;
    let frame2ReceivedInputBefore = false;
    frame2Before.addListener(MetapageEvents.Inputs, () => {
      frame2ReceivedInputBefore = true;
    });

    metapage.setMetaframeOutputs("frame1", { output1: "test-before" });
    // Give any async events time to fire
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(frame2ReceivedInputBefore).toBe(false);
    frame2Before.removeAllListeners(MetapageEvents.Inputs);

    // Now update definition to ADD a connection: frame1.output1 -> frame2.input1
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: {
          url: PASSTHROUGH_URL,
          inputs: [
            { metaframe: "frame1", source: "output1", target: "input1" },
          ],
        },
      },
    };

    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    await secondEventPromise;

    // Now set output on frame1 — frame2 should receive it as input1
    const frame2After = metapage.getMetaframe("frame2")!;
    const inputsPromise = new Promise<MetaframeInputMap>((resolve) => {
      const handler = (inputs: MetaframeInputMap) => {
        frame2After.removeListener(MetapageEvents.Inputs, handler);
        resolve(inputs);
      };
      frame2After.addListener(MetapageEvents.Inputs, handler);
    });

    metapage.setMetaframeOutputs("frame1", { output1: "hello-world" });

    const receivedInputs = await inputsPromise;
    expect(receivedInputs).toBeDefined();
    expect(receivedInputs["input1"]).toBe("hello-world");
  });

  it("new connections to a newly added frame via updateDefinition route data correctly", async () => {
    metapage = new Metapage();

    // Start with one frame
    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Add frame2 with a connection from frame1
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: {
          url: PASSTHROUGH_URL,
          inputs: [{ metaframe: "frame1", source: "data", target: "data" }],
        },
      },
    };

    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    await secondEventPromise;

    // Set output on frame1 — newly added frame2 should receive it
    const frame2 = metapage.getMetaframe("frame2")!;
    const inputsPromise = new Promise<MetaframeInputMap>((resolve) => {
      const handler = (inputs: MetaframeInputMap) => {
        frame2.removeListener(MetapageEvents.Inputs, handler);
        resolve(inputs);
      };
      frame2.addListener(MetapageEvents.Inputs, handler);
    });

    metapage.setMetaframeOutputs("frame1", { data: "new-frame-data" });

    const receivedInputs = await inputsPromise;
    expect(receivedInputs).toBeDefined();
    expect(receivedInputs["data"]).toBe("new-frame-data");
  });

  it("glob connections added via updateDefinition route all matching outputs", async () => {
    metapage = new Metapage();

    // Start with two frames, no connections
    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: { url: PASSTHROUGH_URL },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Update with a glob connection: frame2 receives ALL outputs from frame1
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
        frame2: {
          url: PASSTHROUGH_URL,
          inputs: [{ metaframe: "frame1", source: "**" }],
        },
      },
    };

    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    await secondEventPromise;

    const frame2 = metapage.getMetaframe("frame2")!;
    const inputsPromise = new Promise<MetaframeInputMap>((resolve) => {
      const handler = (inputs: MetaframeInputMap) => {
        frame2.removeListener(MetapageEvents.Inputs, handler);
        resolve(inputs);
      };
      frame2.addListener(MetapageEvents.Inputs, handler);
    });

    metapage.setMetaframeOutputs("frame1", { anyKey: "glob-value" });

    const receivedInputs = await inputsPromise;
    expect(receivedInputs).toBeDefined();
    expect(receivedInputs["anyKey"]).toBe("glob-value");
  });
});
