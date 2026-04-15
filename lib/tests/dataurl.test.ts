/// <reference types="@vitest/browser/providers/playwright" />

import { describe, expect, it, afterEach } from "vitest";
import { Metapage, MetapageDefinition, InjectSecretsPayload } from "../src";

const DATA_URL =
  'data:text/html;type=metapage-divider,<div style="background:red;height:100%"></div>';

describe("Data URL metaframes are not corrupted by new URL()", () => {
  let metapage: Metapage;

  afterEach(() => {
    if (metapage && !metapage.isDisposed()) {
      metapage.dispose();
    }
  });

  it("setDefinition preserves data URL exactly", async () => {
    metapage = new Metapage();
    const definition: MetapageDefinition = {
      metaframes: {
        divider: { url: DATA_URL },
      },
    };

    await metapage.setDefinition(definition);

    const mf = metapage.getMetaframe("divider");
    expect(mf).toBeDefined();
    expect(mf!.url).toBe(DATA_URL);
  });

  it("getDefinition returns data URL unchanged", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { divider: { url: DATA_URL } },
    });

    const def = metapage.getDefinition();
    expect(def.metaframes.divider.url).toBe(DATA_URL);
  });

  it("injectSecrets does not corrupt data URL metaframes", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: {
        divider: { url: DATA_URL },
        normal: { url: "https://example.com/" },
      },
    });

    const secrets: InjectSecretsPayload = {
      frameSecrets: {
        divider: { hashParams: { secret: "val" } },
        normal: { hashParams: { secret: "val" } },
      },
    };

    metapage.injectSecrets(secrets);

    // Data URL must be untouched
    const divider = metapage.getMetaframe("divider");
    expect(divider!.url).toBe(DATA_URL);

    // Normal URL should have the secret injected (sanity check)
    const normal = metapage.getMetaframe("normal");
    expect(normal!.url).toContain("secret");
  });

  it("updateDefinition preserves data URL across definition changes", async () => {
    metapage = new Metapage();

    const def1: MetapageDefinition = {
      metaframes: {
        divider: { url: DATA_URL },
        frame1: { url: "https://example.com/" },
      },
    };

    await metapage.updateDefinition(def1);

    // Add another frame, divider stays
    const def2: MetapageDefinition = {
      metaframes: {
        divider: { url: DATA_URL },
        frame1: { url: "https://example.com/" },
        frame2: { url: "https://example.com/other" },
      },
    };

    await metapage.updateDefinition(def2);

    const divider = metapage.getMetaframe("divider");
    expect(divider!.url).toBe(DATA_URL);
  });

  it("hash param update message does not corrupt data URL", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { divider: { url: DATA_URL } },
    });

    // Simulate a HashParamsUpdate message for the data URL metaframe
    metapage.onMessageJsonRpc({
      iframeId: "divider",
      parentId: metapage._id,
      jsonrpc: "2.0",
      method: "HashParamsUpdate" as any,
      id: "test",
      params: {
        metaframe: "divider",
        hash: "?someParam=value",
      },
    });

    // Data URL must still be unchanged
    const divider = metapage.getMetaframe("divider");
    expect(divider!.url).toBe(DATA_URL);
  });

  it("data URL with injected secrets is excluded from getDefinition secret stripping", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { divider: { url: DATA_URL } },
    });

    // Inject secrets (should be a no-op for data URLs)
    metapage.injectSecrets({
      frameSecrets: {
        divider: { hashParams: { key: "value" } },
      },
    });

    // getDefinition should return data URL unchanged
    const def = metapage.getDefinition();
    expect(def.metaframes.divider.url).toBe(DATA_URL);
  });
});
