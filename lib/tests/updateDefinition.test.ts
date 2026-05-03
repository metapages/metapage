/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it, afterEach } from "vitest";
import {
  Metapage,
  MetapageDefinition,
  MetapageEventDefinition,
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

  // Regression: _applyDefinition() skips existing metaframes entirely,
  // so URL changes for existing frames are silently ignored.
  // See: https://github.com/metapages/metapage-npm/issues/XXX
  it("changing a metaframe URL via updateDefinition updates the live client URL", async () => {
    metapage = new Metapage();

    const URL_A = PASSTHROUGH_URL + "?v=a";
    const URL_B = PASSTHROUGH_URL + "?v=b";

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: URL_A },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Verify initial URL
    const clientBefore = metapage.getMetaframe("frame1")!;
    expect(clientBefore).toBeDefined();
    expect(clientBefore.url).toContain("v=a");

    // Update definition with a DIFFERENT URL for the same metaframe ID
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: URL_B },
      },
    };

    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    await secondEventPromise;

    // The live client should reflect the new URL
    const clientAfter = metapage.getMetaframe("frame1")!;
    expect(clientAfter).toBeDefined();
    expect(clientAfter.url).toContain("v=b");

    // The stored definition should also reflect the new URL
    const storedDef = metapage.getDefinition();
    expect(storedDef.metaframes.frame1.url).toContain("v=b");
  });

  it("changing a metaframe URL via setDefinition updates the live client URL", async () => {
    metapage = new Metapage();

    const URL_A = PASSTHROUGH_URL + "?v=1";
    const URL_B = PASSTHROUGH_URL + "?v=2";

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: URL_A },
      },
    };

    await metapage.setDefinition(def1);

    const clientBefore = metapage.getMetaframe("frame1")!;
    expect(clientBefore).toBeDefined();
    expect(clientBefore.url).toContain("v=1");

    // Call setDefinition again with a changed URL
    await metapage.setDefinition({
      metaframes: {
        frame1: { url: URL_B },
      },
    });

    const clientAfter = metapage.getMetaframe("frame1")!;
    expect(clientAfter).toBeDefined();
    expect(clientAfter.url).toContain("v=2");

    const storedDef = metapage.getDefinition();
    expect(storedDef.metaframes.frame1.url).toContain("v=2");
  });

  it("URL change for one frame does not disrupt pipes to other frames", async () => {
    metapage = new Metapage();

    const URL_A = PASSTHROUGH_URL + "?v=old";
    const URL_B = PASSTHROUGH_URL + "?v=new";

    // Two frames with a pipe: frame1 -> frame2
    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: URL_A },
        frame2: {
          url: PASSTHROUGH_URL,
          inputs: [
            { metaframe: "frame1", source: "output1", target: "input1" },
          ],
        },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Change frame1's URL but keep the same pipe
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: URL_B },
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

    // frame1 URL should be updated
    expect(metapage.getMetaframe("frame1")!.url).toContain("v=new");

    // Pipes should still work after the URL change
    const frame2 = metapage.getMetaframe("frame2")!;
    const inputsPromise = new Promise<MetaframeInputMap>((resolve) => {
      const handler = (inputs: MetaframeInputMap) => {
        frame2.removeListener(MetapageEvents.Inputs, handler);
        resolve(inputs);
      };
      frame2.addListener(MetapageEvents.Inputs, handler);
    });

    metapage.setMetaframeOutputs("frame1", { output1: "after-url-change" });

    const receivedInputs = await inputsPromise;
    expect(receivedInputs["input1"]).toBe("after-url-change");
  });

  // Regression: when a metaframe self-updates its hash params, the parent
  // Metapage updates the client URL and definition in the HashParamsUpdate
  // handler, then emits a Definition event. A downstream consumer listening
  // to that event may call updateDefinition() with the already-applied URL.
  // That round-trip must NOT cause an iframe reload — it's a no-op.
  it("updateDefinition with unchanged URL does not recreate the metaframe client or iframe", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    // Capture references BEFORE the second call
    const clientBefore = metapage.getMetaframe("frame1")!;
    const iframeBefore = clientBefore._iframe;
    const urlBefore = clientBefore.url;

    // Call updateDefinition again with the SAME URL
    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await secondEventPromise;

    const clientAfter = metapage.getMetaframe("frame1")!;

    // Same client object — not removed and re-added
    expect(clientAfter).toBe(clientBefore);
    // Same iframe element — not recreated
    expect(clientAfter._iframe).toBe(iframeBefore);
    // URL unchanged
    expect(clientAfter.url).toBe(urlBefore);
  });

  // Simulates the full round-trip: metaframe changes its hash, the
  // HashParamsUpdate handler updates client.url + definition, then an
  // external consumer calls updateDefinition() with the same definition.
  // The iframe must not reload.
  it("hash-param self-update round-trip via updateDefinition is a no-op for the iframe", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const client = metapage.getMetaframe("frame1")!;
    const iframeElement = client._iframe;

    // --- Simulate what HashParamsUpdate handler does ---
    // The metaframe changed its hash (e.g. internal state save).
    // The handler updates client.url and the definition in place.
    const updatedUrl = PASSTHROUGH_URL + "#?internalState=abc123";
    client.url = updatedUrl;

    // Listen for the Definition event that HashParamsUpdate would emit.
    // We'll capture the definition the external consumer would receive.
    let capturedDefinition: MetapageDefinition | undefined;
    const defListener = (event: MetapageEventDefinition) => {
      capturedDefinition = event.definition;
    };
    metapage.addListener(MetapageEvents.Definition as any, defListener);

    // The handler also updates this._definition. We simulate this by
    // calling updateDefinition with the URL that includes the new hash.
    // But first, let's build the definition as the external consumer
    // would receive it — same frame ID, updated URL.
    const defWithUpdatedHash: MetapageDefinition = {
      metaframes: {
        frame1: { url: updatedUrl },
      },
    };

    // --- External consumer calls updateDefinition with the hash-updated URL ---
    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(defWithUpdatedHash);
    await secondEventPromise;

    metapage.removeListener(MetapageEvents.Definition as any, defListener);

    const clientAfter = metapage.getMetaframe("frame1")!;

    // CRITICAL: same client reference — frame was not removed/re-added
    expect(clientAfter).toBe(client);
    // CRITICAL: same iframe element — not recreated
    expect(clientAfter._iframe).toBe(iframeElement);
    // URL should reflect the hash update (already applied by the handler)
    expect(clientAfter.url).toContain("internalState=abc123");
  });

  // When an external URL change happens for one frame but another frame's
  // URL hasn't changed (e.g. it only self-updated its hash earlier),
  // only the genuinely-changed frame should be updated.
  it("mixed scenario: genuine URL change on one frame, no-op on another", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL + "?v=1" },
        frame2: { url: PASSTHROUGH_URL + "?v=original" },
      },
    };

    const firstEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def1);
    await firstEventPromise;

    const client1Before = metapage.getMetaframe("frame1")!;
    const iframe1Before = client1Before._iframe;
    const client2Before = metapage.getMetaframe("frame2")!;
    const iframe2Before = client2Before._iframe;

    // Update: frame1 gets a new URL, frame2 stays the same
    const def2: MetapageDefinition = {
      metaframes: {
        frame1: { url: PASSTHROUGH_URL + "?v=2" },
        frame2: { url: PASSTHROUGH_URL + "?v=original" },
      },
    };

    const secondEventPromise = nextDefinitionUpdate(metapage);
    await metapage.updateDefinition(def2);
    await secondEventPromise;

    // frame1 should have the updated URL
    const client1After = metapage.getMetaframe("frame1")!;
    expect(client1After.url).toContain("v=2");

    // frame2 should be untouched — same client, same iframe, same URL
    const client2After = metapage.getMetaframe("frame2")!;
    expect(client2After).toBe(client2Before);
    expect(client2After._iframe).toBe(iframe2Before);
    expect(client2After.url).toContain("v=original");
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
