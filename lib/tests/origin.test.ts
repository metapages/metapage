/// <reference types="@vitest/browser/providers/playwright" />

/**
 * #40: "Failed to execute 'postMessage' on 'DOMWindow': The target origin
 * provided does not match the recipient window's origin".
 *
 * The parent posts to a metaframe with the origin of its configured url as the
 * targetOrigin, and the browser drops the message if the document in the
 * iframe is at another origin. Origins stay strictly matched (inputs can carry
 * secrets), but:
 *
 *   - while the parent swaps a metaframe's url, nothing is sent until the new
 *     document registers (it used to go to the old document, at the old origin)
 *   - a late registration ack from the old document is ignored
 *   - only messages from our iframe's window, at the expected origin, are
 *     accepted; a registration from the wrong origin is reported, once
 *   - data: url metaframes (opaque origin) can register at all: posting to
 *     "data:..." as a targetOrigin threw a SyntaxError
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JsonRpcMethodsFromChild,
  Metaframe,
  Metapage,
  MetapageEvents,
} from "../src";

/**
 * A data: url metaframe that speaks the child side of the protocol by hand (it
 * cannot import the library from an opaque origin). It echoes input "x" as
 * output "y", plus `offset`, so tests can tell which document answered.
 */
const echoMetaframeUrl = (offset: number) =>
  "data:text/html," +
  encodeURIComponent(`<script>
const send = (m) => parent.postMessage(Object.assign({ jsonrpc: "2.0", id: "_", iframeId: window.name, parentId }, m), "*");
let parentId;
window.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.method === "SetupIframeServerResponse") {
    parentId = d.params.parentId;
    send({ method: "SetupIframeServerResponseAck", params: { version: "${Metaframe.version}" } });
  }
  if (d.method === "InputsUpdate" && d.params.inputs.x !== undefined) {
    send({ method: "OutputsUpdate", params: { y: d.params.inputs.x + ${offset} } });
  }
});
send({ method: "SetupIframeClientRequest", params: { version: "${Metaframe.version}" } });
</script>`);

/** Same-origin url for an iframe we only need a window from (it 404s) */
const SAME_ORIGIN_URL = `${location.origin}/__metapage-origin-test`;

const messageFrom = (
  source: Window | null,
  origin: string,
  method: JsonRpcMethodsFromChild,
  iframeId: string,
  parentId?: string,
  params: any = { version: Metaframe.version },
) =>
  new MessageEvent("message", {
    data: { jsonrpc: "2.0", id: "_", method, params, iframeId, parentId },
    source,
    origin,
  });

describe("postMessage origins (#40)", () => {
  let metapage: Metapage | undefined;

  afterEach(() => {
    if (metapage && !metapage.isDisposed()) {
      metapage.dispose();
    }
    metapage = undefined;
  });

  const createMetapage = async (url: string) => {
    metapage = await Metapage.from({
      version: "2",
      metaframes: { a: { url } },
    });
    const client = metapage.getMetaframe("a")!;
    document.body.appendChild(await client.iframe);
    await vi.waitFor(() => expect(metapage!._pageLoaded).toBe(true));
    return { metapage, client };
  };

  describe("target origin", () => {
    it("is the origin of the configured url", async () => {
      const { client } = await createMetapage(SAME_ORIGIN_URL);
      client.url = "https://example.com/a/b?c=1#d=2";
      expect(client.expectedOrigin).toBe("https://example.com");
      expect(client.targetOrigin).toBe("https://example.com");
    });

    it('is "*" for a data: url, whose origin is opaque ("null")', async () => {
      const { client } = await createMetapage(echoMetaframeUrl(0));
      expect(client.expectedOrigin).toBe("null");
      expect(client.targetOrigin).toBe("*");
    });

    it("is what postMessage is called with", async () => {
      const { client } = await createMetapage(SAME_ORIGIN_URL);
      // Wait for the 404 document so we spy on the window that stays
      await new Promise((resolve) =>
        client._iframe.addEventListener("load", resolve, { once: true }),
      );
      const spy = vi.spyOn(client._iframe.contentWindow!, "postMessage");
      client.sendRpcInternal("test", {});
      expect(spy).toHaveBeenCalledWith(expect.anything(), location.origin);
    });
  });

  describe("accepting messages", () => {
    it("registers a metaframe asking from our iframe at the expected origin", async () => {
      const { client } = await createMetapage(SAME_ORIGIN_URL);
      const register = vi.spyOn(client, "register");
      window.dispatchEvent(
        messageFrom(
          client._iframe.contentWindow,
          location.origin,
          JsonRpcMethodsFromChild.SetupIframeClientRequest,
          "a",
        ),
      );
      expect(register).toHaveBeenCalledTimes(1);
    });

    it("does not register a metaframe that ended up at another origin, and says why once", async () => {
      const { metapage, client } = await createMetapage(SAME_ORIGIN_URL);
      const register = vi.spyOn(client, "register");
      const errors: string[] = [];
      metapage.on(MetapageEvents.Error, (e: string) => errors.push(e));

      // e.g. the url redirected: the child retries, so this arrives repeatedly
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(
          messageFrom(
            client._iframe.contentWindow,
            "https://redirected.example",
            JsonRpcMethodsFromChild.SetupIframeClientRequest,
            "a",
          ),
        );
      }

      expect(register).not.toHaveBeenCalled();
      const originErrors = errors.filter((e) =>
        e.includes("https://redirected.example"),
      );
      expect(originErrors.length).toBe(1);
      expect(originErrors[0]).toContain(location.origin);
    });

    it("ignores a window other than our iframe claiming to be the metaframe", async () => {
      const { metapage, client } = await createMetapage(SAME_ORIGIN_URL);
      const register = vi.spyOn(client, "register");
      const errors: string[] = [];
      metapage.on(MetapageEvents.Error, (e: string) => errors.push(e));

      window.dispatchEvent(
        messageFrom(
          window,
          location.origin,
          JsonRpcMethodsFromChild.SetupIframeClientRequest,
          "a",
        ),
      );

      expect(register).not.toHaveBeenCalled();
      expect(errors).toEqual([]);
    });

    it("only accepts outputs from the expected origin", async () => {
      const { metapage, client } = await createMetapage(SAME_ORIGIN_URL);
      const outputs = (origin: string, y: number) =>
        messageFrom(
          client._iframe.contentWindow,
          origin,
          JsonRpcMethodsFromChild.OutputsUpdate,
          "a",
          metapage._id,
          { y },
        );

      window.dispatchEvent(outputs("https://elsewhere.example", 1));
      expect(client.outputs.y).toBeUndefined();

      window.dispatchEvent(outputs(location.origin, 2));
      expect(client.outputs.y).toBe(2);
    });

    it("still trusts internal calls, which have no message event", async () => {
      const { metapage, client } = await createMetapage(SAME_ORIGIN_URL);
      metapage.setMetaframeOutputs("a", { y: 3 });
      expect(client.outputs.y).toBe(3);
    });
  });

  describe("data: url metaframes", () => {
    it("register and exchange inputs and outputs", async () => {
      const pageErrors: string[] = [];
      const onError = (e: ErrorEvent) => pageErrors.push(e.message);
      window.addEventListener("error", onError);
      try {
        const { metapage, client } = await createMetapage(echoMetaframeUrl(0));
        await vi.waitFor(() => expect(client._loaded).toBe(true), {
          timeout: 3000,
        });

        await metapage.setInputs({ a: { x: 41 } });
        await vi.waitFor(() => expect(client.outputs.y).toBe(41), {
          timeout: 3000,
        });
        expect(pageErrors).toEqual([]);
      } finally {
        window.removeEventListener("error", onError);
      }
    });
  });

  describe("changing a metaframe url", () => {
    it("stops sending until the new document registers", async () => {
      const { metapage, client } = await createMetapage(echoMetaframeUrl(0));
      await vi.waitFor(() => expect(client._loaded).toBe(true), {
        timeout: 3000,
      });

      const def = JSON.parse(JSON.stringify(metapage.getDefinition()));
      def.metaframes.a.url = echoMetaframeUrl(1000);
      await metapage.setDefinition(def);

      expect(client._loaded).toBe(false);
      const send = vi.spyOn(client, "sendRpcInternal");
      // Inputs keep flowing across the swap
      for (let x = 0; x < 20; x++) {
        await metapage.setInputs({ a: { x } });
      }
      // ...but none of them are posted to the document being replaced
      expect(send).not.toHaveBeenCalledWith("InputsUpdate", expect.anything());

      // The new document registers and gets the latest inputs
      await vi.waitFor(() => expect(client.outputs.y).toBe(19 + 1000), {
        timeout: 3000,
      });
      expect(client._loaded).toBe(true);
    });

    it("ignores a registration ack from the old document", async () => {
      const { client } = await createMetapage(echoMetaframeUrl(0));
      await vi.waitFor(() => expect(client._loaded).toBe(true), {
        timeout: 3000,
      });

      client.setUrl(echoMetaframeUrl(1000));
      // The old document finishing a handshake that started before the swap
      client.registered(Metaframe.version);
      expect(client._loaded).toBe(false);

      // Once the new document asks to register, its ack is accepted
      client.register();
      client.registered(Metaframe.version);
      expect(client._loaded).toBe(true);
    });
  });
});
