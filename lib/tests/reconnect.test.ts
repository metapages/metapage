/// <reference types="@vitest/browser/providers/playwright" />

/**
 * Inputs must survive a metaframe (re)connecting.
 *
 * The parent considers a metaframe connected the moment it has answered its
 * SetupIframeClientRequest, and it cannot know when the metaframe's document
 * goes away: the metaframe can navigate itself, the metapage can change its
 * url, or the iframe element can be moved in the DOM (which reloads it). In
 * all of those cases the parent keeps posting inputs into a document that is
 * being replaced, and the new document starts over with a fresh handshake.
 *
 * Previously inputs were lost in two ways:
 *   - the child threw "Got InputsUpdate but metaframe is not Ready" for
 *     anything that arrived while it was still registering (which is
 *     asynchronous, and can even wait on the network to deserialize the
 *     initial inputs). The thrown message was gone for good.
 *   - the parent only ever sent inputs on the *first* registration, so
 *     everything that changed while an iframe was reloading was never re-sent.
 *
 * Now the child buffers and the parent re-sends all current inputs on every
 * registration.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JsonRpcMethodsFromChild,
  JsonRpcMethodsFromParent,
  Metaframe,
  Metapage,
  MinimumClientMessage,
} from "../src";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A blob encoded as a data url: deserializing it is slow (async, multi-step) */
const BLOB_DATA_URL = "data:text/plain;blob=true;base64,aGVsbG8=";

// ---------------------------------------------------------------------------
// The child half: messages a parent metapage sends to a metaframe
// ---------------------------------------------------------------------------

const setupResponseFromParent = (
  iframeId: string,
  parentId: string,
  inputs: { [key: string]: any } = {},
  source?: Window | null,
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    source,
    data: {
      jsonrpc: "2.0",
      id: "_",
      method: JsonRpcMethodsFromParent.SetupIframeServerResponse,
      params: {
        iframeId,
        parentId,
        state: { inputs },
        version: Metapage.version,
      },
      iframeId,
      parentId,
    },
  });

const inputsUpdateFromParent = (
  iframeId: string,
  parentId: string,
  inputs: { [key: string]: any },
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    data: {
      jsonrpc: "2.0",
      id: "_",
      method: JsonRpcMethodsFromParent.InputsUpdate,
      params: { inputs, parentId },
      iframeId,
      parentId,
    },
  });

describe("Metaframe inputs during (re)connection", () => {
  let metaframe: Metaframe | undefined;

  afterEach(() => {
    metaframe?.dispose();
    metaframe = undefined;
  });

  /** A metaframe that has sent its first registration request */
  const newMetaframeAwaitingRegistration = async (): Promise<Metaframe> => {
    const mf = new Metaframe();
    expect(mf._isIframe).toBe(true);
    mf._setupRequestRetryIntervalMs = 5;
    await vi.waitFor(() =>
      expect(mf._setupRequestSendCount).toBeGreaterThanOrEqual(1),
    );
    return mf;
  };

  it("applies an input that arrives while it is still registering", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    const parentId = "parent-registering";

    // Registration resolves asynchronously, so by the time the parent's
    // answer has been fully processed it has already sent this update: the
    // parent considers us connected as soon as it answered.
    window.dispatchEvent(
      setupResponseFromParent(metaframe.id, parentId, { a: 1 }),
    );
    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, parentId, { b: 2 }),
    );

    await metaframe.connected();
    await vi.waitFor(() =>
      expect(metaframe!.getInputs()).toEqual({ a: 1, b: 2 }),
    );
  });

  it("applies an input that arrives before the parent answered at all", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    const parentId = "parent-early-inputs";

    // The parent answered a request we never received (it went into our
    // previous document) and is already sending inputs
    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, parentId, { early: "yes" }),
    );
    expect(metaframe._pendingInputsUpdates.length).toBe(1);
    expect(metaframe.getInputs()).toEqual({});

    window.dispatchEvent(setupResponseFromParent(metaframe.id, parentId));
    await metaframe.connected();
    await vi.waitFor(() =>
      expect(metaframe!.getInputs()).toEqual({ early: "yes" }),
    );
  });

  it("notifies listeners of inputs buffered during registration", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    const parentId = "parent-notify";
    const seen: any[] = [];
    metaframe.onInputs((inputs) => seen.push(inputs));

    window.dispatchEvent(setupResponseFromParent(metaframe.id, parentId));
    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, parentId, { b: 2 }),
    );

    await metaframe.connected();
    await vi.waitFor(() => expect(seen).toEqual([{ b: 2 }]));
  });

  it("drops a buffered input from a parent it did not register with", async () => {
    metaframe = await newMetaframeAwaitingRegistration();

    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, "some-other-metapage", {
        hostile: true,
      }),
    );
    expect(metaframe._pendingInputsUpdates.length).toBe(1);

    window.dispatchEvent(setupResponseFromParent(metaframe.id, "our-parent"));
    await metaframe.connected();
    await delay(50);

    expect(metaframe.getInputs()).toEqual({});
    expect(metaframe._pendingInputsUpdates.length).toBe(0);
  });

  it("ignores inputs from another parent once registered", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    window.dispatchEvent(setupResponseFromParent(metaframe.id, "our-parent"));
    await metaframe.connected();

    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, "some-other-metapage", {
        hostile: true,
      }),
    );
    await delay(50);

    expect(metaframe.getInputs()).toEqual({});
  });

  it("bounds the buffer of inputs received before registration", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    for (let i = 0; i < 150; i++) {
      window.dispatchEvent(
        inputsUpdateFromParent(metaframe.id, "parent-flood", { i }),
      );
    }
    expect(metaframe._pendingInputsUpdates.length).toBe(100);
    // The newest are kept: the parent re-sends everything on registration, so
    // only intermediate values can be dropped
    expect(metaframe._pendingInputsUpdates.pop()!.inputs).toEqual({ i: 149 });
  });

  it("applies updates in the order they arrived, not the order they deserialize", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    const parentId = "parent-ordering";
    window.dispatchEvent(setupResponseFromParent(metaframe.id, parentId));
    await metaframe.connected();

    // The first value has to be fetched+decoded, the second is applied as-is.
    // Unqueued, the second would be applied first and this stale blob would
    // end up as the final value.
    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, parentId, { v: BLOB_DATA_URL }),
    );
    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, parentId, { v: "latest" }),
    );

    await delay(200);
    expect(metaframe.getInput("v")).toBe("latest");
  });

  it("re-acks a setup response it has already resolved", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    const parentId = "parent-reack";
    window.dispatchEvent(setupResponseFromParent(metaframe.id, parentId));
    await metaframe.connected();

    const sentToParent: { method: string; params: any }[] = [];
    metaframe.sendRpc = (method: any, params: any) =>
      sentToParent.push({ method, params });

    // The parent answers again (our retry crossed its first answer, or it
    // wants us to re-register). Ignoring it leaves the parent holding inputs
    // it believes we received.
    window.dispatchEvent(setupResponseFromParent(metaframe.id, parentId));
    await delay(20);

    expect(
      sentToParent.filter(
        (m) =>
          m.method === JsonRpcMethodsFromChild.SetupIframeServerResponseAck,
      ).length,
    ).toBe(1);
  });

  it("ignores a setup response from a window that is not its parent", async () => {
    metaframe = await newMetaframeAwaitingRegistration();

    // Another window on the page, i.e. not the one embedding us
    const otherFrame = document.createElement("iframe");
    document.body.appendChild(otherFrame);
    window.dispatchEvent(
      setupResponseFromParent(
        metaframe.id,
        "not-our-parent",
        { hostile: true },
        otherFrame.contentWindow,
      ),
    );
    await delay(50);

    expect(metaframe.isConnected()).toBe(false);
    expect(metaframe.getInputs()).toEqual({});
    otherFrame.remove();
  });

  it("registers against a new parent and takes its inputs", async () => {
    metaframe = await newMetaframeAwaitingRegistration();
    window.dispatchEvent(
      setupResponseFromParent(metaframe.id, "parent-first", { a: 1 }),
    );
    await metaframe.connected();
    await vi.waitFor(() => expect(metaframe!.getInputs()).toEqual({ a: 1 }));

    // The parent page was recreated: without re-registering, every input from
    // it would be rejected by the parent id check and this metaframe would
    // never receive another input.
    window.dispatchEvent(
      setupResponseFromParent(metaframe.id, "parent-second", { b: 2 }),
    );
    await vi.waitFor(() => expect(metaframe!._parentId).toBe("parent-second"));
    await vi.waitFor(() =>
      expect(metaframe!.getInputs()).toEqual({ a: 1, b: 2 }),
    );

    window.dispatchEvent(
      inputsUpdateFromParent(metaframe.id, "parent-second", { c: 3 }),
    );
    await vi.waitFor(() =>
      expect(metaframe!.getInputs()).toEqual({ a: 1, b: 2, c: 3 }),
    );
  });
});

// ---------------------------------------------------------------------------
// The parent half: a metapage whose metaframe registers more than once
// ---------------------------------------------------------------------------

const FRAME_URL = "data:text/html,<html><body>frame</body></html>";

describe("Metapage sends current inputs on every registration", () => {
  let metapage: Metapage | undefined;

  afterEach(() => {
    if (metapage && !metapage.isDisposed()) {
      metapage.dispose();
    }
    metapage = undefined;
  });

  /** As sent by a metaframe document that just loaded */
  const registrationRequest = (mp: Metapage, iframeId: string) =>
    mp.onMessageJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: JsonRpcMethodsFromChild.SetupIframeClientRequest,
      params: { version: Metaframe.version },
      iframeId,
      parentId: undefined,
    } as MinimumClientMessage<any>);

  /** As sent by a metaframe that received the setup response */
  const registrationAck = (mp: Metapage, iframeId: string) =>
    mp.onMessageJsonRpc({
      jsonrpc: "2.0",
      id: 2,
      method: JsonRpcMethodsFromChild.SetupIframeServerResponseAck,
      params: { version: Metaframe.version },
      iframeId,
      parentId: (mp as any)._id,
    } as MinimumClientMessage<any>);

  const inputsUpdates = (sent: MinimumClientMessage<any>[]) =>
    sent.filter((m) => m.method === JsonRpcMethodsFromParent.InputsUpdate);

  it("re-sends everything to a metaframe that reloaded", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { frame1: { url: FRAME_URL } },
    });
    const client = metapage.getMetaframe("frame1")!;
    // setInputs only posts to an iframe that is in the dom
    document.body.appendChild(await client.iframe);
    const sent: MinimumClientMessage<any>[] = [];
    client.sendOrBufferPostMessage = (m: any) => sent.push(m);

    registrationRequest(metapage, "frame1");
    registrationAck(metapage, "frame1");
    metapage.setInput("frame1", "a", 1);
    await vi.waitFor(() =>
      expect(inputsUpdates(sent).length).toBeGreaterThan(0),
    );

    // The iframe reloads. A brand new document asks to be registered, and
    // gets the current inputs with the answer.
    sent.length = 0;
    registrationRequest(metapage, "frame1");
    const response = sent.find(
      (m) => m.method === JsonRpcMethodsFromParent.SetupIframeServerResponse,
    );
    expect(response!.params.state.inputs).toEqual({ a: 1 });

    // An upstream input arrives while that new document is still handshaking:
    // whatever we post now may land in a document that is going away
    metapage.setInput("frame1", "b", 2);
    await delay(10);

    // It registers, so bring it fully up to date
    registrationAck(metapage, "frame1");
    await vi.waitFor(() => {
      const last = inputsUpdates(sent).pop();
      expect(last?.params?.inputs).toEqual({ a: 1, b: 2 });
    });
  });

  it("sends the inputs set before the metaframe ever registered", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { frame1: { url: FRAME_URL } },
    });
    const client = metapage.getMetaframe("frame1")!;
    document.body.appendChild(await client.iframe);
    const sent: MinimumClientMessage<any>[] = [];
    client.sendOrBufferPostMessage = (m: any) => sent.push(m);

    // Nothing is sent to an unregistered metaframe...
    metapage.setInput("frame1", "a", 1);
    await delay(10);
    expect(inputsUpdates(sent).length).toBe(0);

    // ...it arrives when it registers
    registrationRequest(metapage, "frame1");
    registrationAck(metapage, "frame1");
    await vi.waitFor(() => {
      const last = inputsUpdates(sent).pop();
      expect(last?.params?.inputs).toEqual({ a: 1 });
    });
  });

  it("flushes messages queued while unregistered in the order they were queued", async () => {
    metapage = new Metapage();
    await metapage.setDefinition({
      metaframes: { frame1: { url: FRAME_URL } },
    });
    const client = metapage.getMetaframe("frame1")!;
    document.body.appendChild(await client.iframe);
    const sent: MinimumClientMessage<any>[] = [];
    client.sendOrBufferPostMessage = (m: any) => sent.push(m);

    // Not registered yet, so these are held until it is. Reversing them would
    // let an older value overwrite a newer one.
    client.sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: { v: "first" },
    });
    client.sendRpc(JsonRpcMethodsFromParent.InputsUpdate, {
      inputs: { v: "second" },
    });
    expect(inputsUpdates(sent).length).toBe(0);

    registrationRequest(metapage, "frame1");
    registrationAck(metapage, "frame1");

    expect(inputsUpdates(sent).map((m) => m.params.inputs.v)).toEqual([
      "first",
      "second",
    ]);
  });
});
