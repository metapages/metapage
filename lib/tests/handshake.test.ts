/// <reference types="@vitest/browser/providers/playwright" />

/**
 * Regression tests for the metapage <-> metaframe registration handshake.
 *
 * The handshake used to be fatally order-dependent (see ARCHITECTURE.md):
 *
 *   - the child sent SetupIframeClientRequest exactly once, on its page load
 *   - the parent only attached its postMessage listener on *its* page load
 *
 * A parent that finished loading after the child (a slow bundle, or iframes
 * created from an asynchronously fetched definition) never heard the request,
 * and nothing retried it: the metaframe stayed blank forever.
 *
 * Both halves are covered here: the child now retries until answered, and the
 * parent now listens from construction, buffering until it is loaded.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JsonRpcMethodsFromChild,
  JsonRpcMethodsFromParent,
  Metaframe,
  Metapage,
  MinimumClientMessage,
  PRE_PAGE_LOAD_MESSAGE_BUFFER_MAX,
  SETUP_REQUEST_RETRY_INTERVAL_MAX_MS,
} from "../src";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A SetupIframeClientRequest exactly as a child metaframe sends it */
const setupRequestFromChild = (
  iframeId: string,
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: JsonRpcMethodsFromChild.SetupIframeClientRequest,
      params: { version: Metaframe.version },
      iframeId,
      parentId: undefined,
    },
  });

/** A SetupIframeServerResponse exactly as a parent metapage sends it */
const setupResponseFromParent = (
  iframeId: string,
  parentId: string,
): MessageEvent<MinimumClientMessage<any>> =>
  new MessageEvent("message", {
    data: {
      jsonrpc: "2.0",
      id: "_",
      method: JsonRpcMethodsFromParent.SetupIframeServerResponse,
      params: {
        iframeId,
        parentId,
        state: { inputs: {} },
        version: Metapage.version,
      },
      iframeId,
      parentId,
    },
  });

describe("Metaframe SetupIframeClientRequest retry", () => {
  let metaframe: Metaframe | undefined;

  afterEach(() => {
    metaframe?.dispose();
    metaframe = undefined;
  });

  it("keeps asking the parent to register it until the parent answers", async () => {
    metaframe = new Metaframe();
    // The machinery is only installed for iframes, and vitest browser mode runs
    // tests inside one. If this ever stops being true the rest is meaningless.
    expect(metaframe._isIframe).toBe(true);
    // Shrink the backoff so the test does not wait on the real 200ms first retry
    metaframe._setupRequestRetryIntervalMs = 5;

    // Nothing is answering, so it should keep re-sending rather than give up
    await vi.waitFor(
      () => expect(metaframe!._setupRequestSendCount).toBeGreaterThanOrEqual(3),
      {
        timeout: 2000,
      },
    );
    expect(metaframe.isConnected()).toBe(false);
  });

  it("backs off between retries rather than spinning", async () => {
    metaframe = new Metaframe();
    metaframe._setupRequestRetryIntervalMs = 5;

    await vi.waitFor(
      () => expect(metaframe!._setupRequestSendCount).toBeGreaterThanOrEqual(4),
      {
        timeout: 2000,
      },
    );
    // 5 -> 10 -> 20 -> 40 ...: strictly increasing, capped
    expect(metaframe._setupRequestRetryIntervalMs).toBeGreaterThan(5);
    expect(metaframe._setupRequestRetryIntervalMs).toBeLessThanOrEqual(
      SETUP_REQUEST_RETRY_INTERVAL_MAX_MS,
    );
  });

  it("stops retrying and connects once the parent responds", async () => {
    metaframe = new Metaframe();
    metaframe._setupRequestRetryIntervalMs = 5;

    await vi.waitFor(() =>
      expect(metaframe!._setupRequestSendCount).toBeGreaterThanOrEqual(1),
    );

    window.dispatchEvent(
      setupResponseFromParent(metaframe.id, "test-parent-id"),
    );
    await metaframe.connected();

    expect(metaframe.isConnected()).toBe(true);
    expect(metaframe._setupRequestTimeout).toBeUndefined();

    // No further requests after the parent answered
    const sendCountAtConnect = metaframe._setupRequestSendCount;
    await delay(60);
    expect(metaframe._setupRequestSendCount).toBe(sendCountAtConnect);
  });

  it("a late parent still registers the metaframe (the original bug)", async () => {
    metaframe = new Metaframe();
    metaframe._setupRequestRetryIntervalMs = 5;

    // The parent is busy loading and hears nothing for a while...
    await delay(50);
    expect(metaframe.isConnected()).toBe(false);
    expect(metaframe._setupRequestSendCount).toBeGreaterThan(1);

    // ...and only then starts listening and answers a retry
    window.dispatchEvent(
      setupResponseFromParent(metaframe.id, "test-parent-id"),
    );
    await metaframe.connected();
    expect(metaframe.isConnected()).toBe(true);
  });

  it("dispose cancels a pending retry", async () => {
    metaframe = new Metaframe();
    metaframe._setupRequestRetryIntervalMs = 5;
    await vi.waitFor(() =>
      expect(metaframe!._setupRequestSendCount).toBeGreaterThanOrEqual(1),
    );

    metaframe.dispose();
    const sendCountAtDispose = metaframe._setupRequestSendCount;
    await delay(60);

    expect(metaframe._setupRequestTimeout).toBeUndefined();
    expect(metaframe._setupRequestSendCount).toBe(sendCountAtDispose);
    metaframe = undefined; // already disposed
  });
});

describe("Metapage listens before page load", () => {
  let metapage: Metapage | undefined;

  afterEach(() => {
    if (metapage && !metapage.isDisposed()) {
      metapage.dispose();
    }
    metapage = undefined;
  });

  it("captures a message sent in the same tick it was constructed", () => {
    metapage = new Metapage();
    // pageLoaded() resolves on a microtask, so the page-load handler has not run
    expect(metapage._pageLoaded).toBe(false);

    // Previously the listener was only attached inside pageLoaded().then(), so
    // this message was dropped on the floor and never recoverable.
    window.dispatchEvent(setupRequestFromChild("some-metaframe"));

    expect(metapage._bufferedMessages.length).toBe(1);
  });

  it("drains buffered messages to the JSON-RPC handler once loaded", async () => {
    metapage = new Metapage();
    const handled: MinimumClientMessage<any>[] = [];
    metapage.onMessageJsonRpc = (jsonrpc: MinimumClientMessage<any>) => {
      handled.push(jsonrpc);
    };

    window.dispatchEvent(setupRequestFromChild("metaframe-a"));
    window.dispatchEvent(setupRequestFromChild("metaframe-b"));
    // Buffered, not yet handled
    expect(handled.length).toBe(0);

    await vi.waitFor(() => expect(metapage!._pageLoaded).toBe(true));

    expect(metapage._bufferedMessages.length).toBe(0);
    // Delivered, and in the order they arrived
    expect(handled.map((m) => m.iframeId)).toEqual([
      "metaframe-a",
      "metaframe-b",
    ]);
  });

  it("handles messages immediately once loaded, without buffering", async () => {
    metapage = new Metapage();
    const handled: MinimumClientMessage<any>[] = [];
    metapage.onMessageJsonRpc = (jsonrpc: MinimumClientMessage<any>) => {
      handled.push(jsonrpc);
    };
    await vi.waitFor(() => expect(metapage!._pageLoaded).toBe(true));

    window.dispatchEvent(setupRequestFromChild("metaframe-c"));

    expect(metapage._bufferedMessages.length).toBe(0);
    expect(handled.map((m) => m.iframeId)).toEqual(["metaframe-c"]);
  });

  it("registers a metaframe whose request arrived before the page loaded", async () => {
    const metaframeId = "buffered-metaframe";
    metapage = new Metapage();

    // Stand in for a metaframe client the parent has already created. The real
    // one needs a live iframe contentWindow to postMessage its response to.
    let registerCount = 0;
    metapage.getMetaframe = () => ({ register: () => registerCount++ }) as any;

    window.dispatchEvent(setupRequestFromChild(metaframeId));
    expect(registerCount).toBe(0);

    await vi.waitFor(() => expect(metapage!._pageLoaded).toBe(true));

    expect(registerCount).toBe(1);
  });

  it("bounds the pre-load buffer so a page that never loads cannot grow it forever", () => {
    metapage = new Metapage();

    for (let i = 0; i < PRE_PAGE_LOAD_MESSAGE_BUFFER_MAX + 25; i++) {
      window.dispatchEvent(setupRequestFromChild(`metaframe-${i}`));
    }

    expect(metapage._bufferedMessages.length).toBe(
      PRE_PAGE_LOAD_MESSAGE_BUFFER_MAX,
    );
  });

  it("dispose before page load drops the buffer and detaches the listener", async () => {
    metapage = new Metapage();
    window.dispatchEvent(setupRequestFromChild("metaframe-d"));
    expect(metapage._bufferedMessages.length).toBe(1);

    metapage.dispose();
    expect(metapage._bufferedMessages.length).toBe(0);

    // No listener, and the (disposed) page-load handler must not throw
    window.dispatchEvent(setupRequestFromChild("metaframe-e"));
    await delay(20);
    expect(metapage._bufferedMessages.length).toBe(0);
  });
});
