/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it, afterEach } from "vitest";
import {
  Metapage,
  MetapageDefinition,
  MetapageEventDefinitionUpdate,
  MetapageState,
} from "../src";

const PASSTHROUGH_URL =
  "https://metapage.io/metaframes/passthrough-markdown/";

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
});
