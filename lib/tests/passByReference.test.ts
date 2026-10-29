/// <reference types="@vitest/browser/providers/playwright" />

/**
 * Pass by reference (#208): with `passByReference`, binary values travel
 * between metaframes as-is (structured clone) instead of as base64 data URLs.
 *
 * It is negotiated per metaframe: the metaframe says it supports it in its
 * SetupIframeClientRequest, the metapage answers whether it wants it. A
 * metaframe from an older library never says so, and keeps getting data URLs.
 *
 * The end-to-end tests run real iframes (tests/fixtures) on the library
 * source, so both halves of the handshake are the real thing.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JsonRpcMethodsFromChild,
  JsonRpcMethodsFromParent,
  Metaframe,
  Metapage,
  MetapageIFrameRpcClient,
} from "../src";

// Served by vitest from the project root. Not `import.meta.url`: that is
// sometimes the module's file system path, which the server does not serve.
const FIXTURE_URL = `${window.location.origin}/tests/fixtures/pass-by-reference-metaframe.html`;

const isDataUrl = (value: any) =>
  typeof value === "string" && value.startsWith("data:");

/** producer.out -> consumer.in, both in the document so they load */
const producerConsumerMetapage = async (
  passByReference?: boolean,
): Promise<Metapage> => {
  const metapage = new Metapage({ passByReference });
  await metapage.setDefinition({
    version: "2",
    metaframes: {
      producer: { url: `${FIXTURE_URL}?role=producer` },
      consumer: {
        url: `${FIXTURE_URL}?role=consumer`,
        inputs: [{ metaframe: "producer", source: "out", target: "in" }],
      },
    },
  });
  for (const id of metapage.getMetaframeIds()) {
    document.body.appendChild(await metapage.getMetaframe(id).iframe);
  }
  return metapage;
};

/** Ask the producer to output something, wait for what the consumer got */
const sendThroughPipe = async (
  metapage: Metapage,
  spec: { bytes?: number[]; nested?: boolean; text?: string },
): Promise<any> => {
  metapage.setInput("producer", "send", spec);
  await vi.waitFor(
    () =>
      expect(
        metapage.getState().metaframes.outputs.consumer?.received,
      ).toBeTruthy(),
    { timeout: 10000 },
  );
  return metapage.getState().metaframes.outputs.consumer.received;
};

describe("passByReference end to end", () => {
  let metapage: Metapage | undefined;

  afterEach(() => {
    metapage?.dispose();
    metapage = undefined;
  });

  it("passes a TypedArray as-is from producer to consumer", async () => {
    metapage = await producerConsumerMetapage(true);
    const received = await sendThroughPipe(metapage, { bytes: [1, 2, 3] });

    expect(received).toEqual({ type: "Uint8Array", bytes: [1, 2, 3] });
    // Never encoded on the way: the metapage holds the raw value both as the
    // producer's output and as the consumer's input
    const { inputs, outputs } = metapage.getState().metaframes;
    expect(outputs.producer.out).toBeInstanceOf(Uint8Array);
    expect(inputs.consumer.in).toBeInstanceOf(Uint8Array);
  });

  it("passes a Blob as-is", async () => {
    metapage = await producerConsumerMetapage(true);
    const received = await sendThroughPipe(metapage, { text: "hello" });

    expect(received).toEqual({ type: "Blob", text: "hello" });
    expect(metapage.getState().metaframes.outputs.producer.out).toBeInstanceOf(
      Blob,
    );
  });

  it("passes binary values nested inside an object", async () => {
    metapage = await producerConsumerMetapage(true);
    const received = await sendThroughPipe(metapage, {
      bytes: [4, 5],
      nested: true,
    });

    expect(received).toEqual({
      nested: { type: "Uint8Array", bytes: [4, 5] },
    });
  });

  it("is off by default: values travel as data URLs, and arrive the same", async () => {
    metapage = await producerConsumerMetapage();
    const received = await sendThroughPipe(metapage, { bytes: [1, 2, 3] });

    // The consumer cannot tell the difference...
    expect(received).toEqual({ type: "Uint8Array", bytes: [1, 2, 3] });
    // ...but everything in between was a base64 data URL
    const { inputs, outputs } = metapage.getState().metaframes;
    expect(isDataUrl(outputs.producer.out)).toBe(true);
    expect(isDataUrl(inputs.consumer.in)).toBe(true);
  });
});

describe("passByReference negotiation (metapage side)", () => {
  let metapage: Metapage | undefined;

  afterEach(() => {
    metapage?.dispose();
    metapage = undefined;
  });

  /** A metaframe client whose outgoing messages are captured, not posted */
  const capturingClient = async (passByReference: boolean) => {
    metapage = new Metapage({ passByReference });
    await metapage.setDefinition({
      version: "2",
      metaframes: { mf: { url: "about:blank" } },
    });
    const client: MetapageIFrameRpcClient = metapage.getMetaframe("mf");
    const sent: { method: string; params: any }[] = [];
    client.sendRpcInternal = (method: string, params: any) => {
      sent.push({ method, params });
    };
    client._loaded = true;
    document.body.appendChild(client._iframe);
    return { client, sent };
  };

  const lastInputsSent = async (sent: { method: string; params: any }[]) => {
    await vi.waitFor(() =>
      expect(
        sent.some((m) => m.method === JsonRpcMethodsFromParent.InputsUpdate),
      ).toBe(true),
    );
    return sent
      .filter((m) => m.method === JsonRpcMethodsFromParent.InputsUpdate)
      .pop()!.params.inputs;
  };

  it("sends binary values as-is to a metaframe that supports it", async () => {
    const { client, sent } = await capturingClient(true);
    client.register({ version: Metaframe.version, passByReference: true });

    expect(sent[0].method).toBe(
      JsonRpcMethodsFromParent.SetupIframeServerResponse,
    );
    expect(sent[0].params.passByReference).toBe(true);

    client.sendInputs({ a: new Uint8Array([1, 2]) });
    expect((await lastInputsSent(sent)).a).toBeInstanceOf(Uint8Array);
  });

  it("keeps sending data URLs to an older metaframe that never asked", async () => {
    const { client, sent } = await capturingClient(true);
    // Exactly what pre-#208 metaframes send
    client.register({ version: Metaframe.version });

    expect(sent[0].params.passByReference).toBeUndefined();
    client.sendInputs({ a: new Uint8Array([1, 2]) });
    expect(isDataUrl((await lastInputsSent(sent)).a)).toBe(true);
  });

  it("sends data URLs when the metapage has not enabled it", async () => {
    const { client, sent } = await capturingClient(false);
    client.register({ version: Metaframe.version, passByReference: true });

    expect(sent[0].params.passByReference).toBeUndefined();
    client.sendInputs({ a: new Uint8Array([1, 2]) });
    expect(isDataUrl((await lastInputsSent(sent)).a)).toBe(true);
  });

  it("re-negotiates when the iframe's document is replaced", async () => {
    const { client } = await capturingClient(true);
    client.register({ version: Metaframe.version, passByReference: true });
    expect(client.isPassByReference()).toBe(true);
    // The metaframe navigated to a page running an older library
    client.register({ version: Metaframe.version });
    expect(client.isPassByReference()).toBe(false);
  });
});

describe("passByReference negotiation (metaframe side)", () => {
  let metaframe: Metaframe | undefined;

  afterEach(() => {
    metaframe?.dispose();
    metaframe = undefined;
  });

  /** A metaframe whose outgoing messages are captured, not posted */
  const capturingMetaframe = () => {
    const mf = new Metaframe();
    expect(mf._isIframe).toBe(true);
    const sent: { method: string; params: any }[] = [];
    mf.sendRpc = (method: JsonRpcMethodsFromChild, params: any) => {
      sent.push({ method, params });
    };
    return { mf, sent };
  };

  const register = async (mf: Metaframe, passByReference?: boolean) => {
    // The parent can only answer a request we have sent
    await vi.waitFor(() =>
      expect(mf._setupRequestSendCount).toBeGreaterThanOrEqual(1),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          jsonrpc: "2.0",
          id: "_",
          method: JsonRpcMethodsFromParent.SetupIframeServerResponse,
          params: {
            iframeId: mf.id,
            parentId: "parent",
            state: { inputs: {} },
            version: Metapage.version,
            passByReference,
          },
          iframeId: mf.id,
          parentId: "parent",
        },
      }),
    );
    await mf.connected();
  };

  const lastOutputsSent = (sent: { method: string; params: any }[]) =>
    sent
      .filter((m) => m.method === JsonRpcMethodsFromChild.OutputsUpdate)
      .pop()!.params;

  it("tells the parent it supports pass by reference", async () => {
    const { mf, sent } = capturingMetaframe();
    metaframe = mf;
    await vi.waitFor(() => expect(sent.length).toBeGreaterThan(0));
    expect(sent[0].method).toBe(
      JsonRpcMethodsFromChild.SetupIframeClientRequest,
    );
    expect(sent[0].params.passByReference).toBe(true);
  });

  it("does not ask for it when it handles data URLs itself", async () => {
    const { mf, sent } = capturingMetaframe();
    metaframe = mf;
    // Set right after construction, as metaframes do: the request is only
    // sent once the page has loaded
    mf.isInputOutputBlobSerialization = false;
    await vi.waitFor(() => expect(sent.length).toBeGreaterThan(0));
    expect(sent[0].params.passByReference).toBe(false);
  });

  it("sends outputs as-is when the parent asked for it", async () => {
    const { mf, sent } = capturingMetaframe();
    metaframe = mf;
    await register(mf, true);

    await mf.setOutputs({ frame: new Uint8Array([7]) });
    expect(lastOutputsSent(sent).frame).toBeInstanceOf(Uint8Array);
  });

  it("serializes outputs for a parent that did not ask (an older metapage)", async () => {
    const { mf, sent } = capturingMetaframe();
    metaframe = mf;
    await register(mf, undefined);

    await mf.setOutputs({ frame: new Uint8Array([7]) });
    expect(isDataUrl(lastOutputsSent(sent).frame)).toBe(true);
  });
});
